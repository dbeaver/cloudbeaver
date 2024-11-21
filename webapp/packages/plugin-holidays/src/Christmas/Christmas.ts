/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { debounce, throttle } from '@cloudbeaver/core-utils';

type Flake = {
  x: number;
  y: number;
  size: number;
  stepSize: number;
  speed: number;
  step: number;
  angle: number;
  velY: any;
  velX: number;
  shape: number;
  opacity: number;
};

function addSnowFlakes(flakes: Flake[], width: number, count: number = 1) {
  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * width),
      y = 0,
      size = Math.random() * 5 + 2.5,
      speed = Math.random() * 1 + 0.33,
      opacity = Math.random() * 0.5 + 0.3;

    flakes.push({
      speed: speed,
      shape: Math.floor(Math.random() * 5 + 5),
      velY: speed,
      velX: 0,
      x: x,
      y: y,
      size: size,
      stepSize: Math.random() / 30,
      step: 0,
      angle: Math.random() < 0.5 ? 1 : -1,
      opacity: opacity,
    });
  }
}

function respawnFlake(flake: Flake, width: number) {
  flake.y = 0;
  flake.x = Math.floor(Math.random() * width);
  flake.speed = Math.random() * 0.5 + 0.4;
  flake.velY = flake.speed;
  flake.velX = 0;
  flake.opacity = Math.random() * 0.5 + 0.3;
}

const MIN_EFFECTIVE_DISTANCE = 300;
const FRAME_DURATION = 1000 / 60; // 60 FPS
const FLAKE_ADDING_INTERVAL = 100; //ms
const SNOWFALL_TIMEOUT = 60000; // 1 minute
const BASE_FLAKES_COUNT = 250;
const BASE_CANVAS_AREA = 1920 * 1080;

export class Christmas {
  private isMouseMoving = false;
  private flakes: Flake[] = [];
  private lastFrameTime = 0;
  private lastFlakeTime = 0;
  private mX = -MIN_EFFECTIVE_DISTANCE;
  private mY = -MIN_EFFECTIVE_DISTANCE;
  private ctx: CanvasRenderingContext2D | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private maxFlakesCount = 0;
  private stopTimeoutId: number | undefined = undefined;
  private mouseMovingTimeoutId: number | undefined = undefined;
  private isRunning = false;
  public isSnowFalling = false;

  constructor() {
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);

    makeObservable(this, {
      isSnowFalling: observable,
    });
  }

  private calculateMaxFlakesCount(width: number, height: number) {
    const currentArea = width * height;
    this.maxFlakesCount = Math.round((currentArea / BASE_CANVAS_AREA) * BASE_FLAKES_COUNT);
  }

  private createCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '1';
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
  }

  private setMouseMoving() {
    this.isMouseMoving = true;

    if (this.mouseMovingTimeoutId) {
      clearTimeout(this.mouseMovingTimeoutId);
    }
    this.mouseMovingTimeoutId = window.setTimeout(() => {
      this.isMouseMoving = false;
    }, 100);
  }

  private setMouseMovingThrottled = throttle(this.setMouseMoving.bind(this), 60);

  private onResize() {
    this.calculateMaxFlakesCount(window.innerWidth, window.innerHeight);
    if (this.canvas) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
  }

  private onResizeDebounced = debounce(this.onResize.bind(this), 500);

  private onMouseMove(e: MouseEvent) {
    this.setMouseMovingThrottled();
    this.mX = e.clientX;
    this.mY = e.clientY;
  }

  private onMouseLeave() {
    this.mX = -MIN_EFFECTIVE_DISTANCE;
    this.mY = -MIN_EFFECTIVE_DISTANCE;
  }

  private autoStop() {
    if (this.isSnowFalling) {
      this.stop.call(this);
    }
  }

  private drawSnowflake(flake: Flake) {
    if (!this.ctx) {
      return;
    }

    const { x, y, size, opacity, velY, shape } = flake;

    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(flake.angle);
    this.ctx.strokeStyle = velY > 1.8 ? 'rgba(187,238,255,1)' : 'rgba(153,204,255,' + opacity + ')';
    this.ctx.lineWidth = 2;

    for (let i = 0; i < shape; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.lineTo(0, -size);
      this.ctx.moveTo(0, -size / 2);
      this.ctx.lineTo(size / 4, -size / 2.5);
      this.ctx.moveTo(0, -size / 2);
      this.ctx.lineTo(-size / 4, -size / 2.5);
      this.ctx.stroke();
      this.ctx.rotate(Math.PI / (shape / 2));
    }

    this.ctx.restore();

    const addAngle = 0.1 / shape + 0.02 * velY;
    flake.angle = flake.angle > 0 ? flake.angle + addAngle : flake.angle - addAngle;
  }

  private applyForces(flake: Flake) {
    const x = this.mX;
    const y = this.mY;
    const x2 = flake.x;
    const y2 = flake.y;

    const dx = x2 - x;
    const dy = y2 - y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < MIN_EFFECTIVE_DISTANCE && dist > 20 && this.isMouseMoving) {
      const force = MIN_EFFECTIVE_DISTANCE / ((dist * dist) / 10);

      const xcomp = (x - x2) / dist;
      const ycomp = (y - y2) / dist;
      const deltaV = force / 2;

      flake.velX += deltaV * xcomp * Math.random() * 0.8;
      flake.velY += deltaV * ycomp * Math.random() * 0.8;
    } else {
      if (flake.velY < flake.speed) {
        flake.velY = flake.speed;
      }
      flake.velX += Math.cos((flake.step += Math.random() * 0.03)) * flake.stepSize;
    }

    flake.velY = Math.min(flake.velY, 3);

    flake.velX *= 0.98;
    flake.velY *= 0.99;

    flake.y += flake.velY;
    flake.x += flake.velX;
  }

  private clean() {
    if (this.canvas) {
      document.body.removeChild(this.canvas);
      this.canvas = null;
      this.ctx = null;
      this.isRunning = false;
    }
  }

  private adjustFlakesCount(timestamp: number) {
    if (this.isSnowFalling && this.flakes.length < this.maxFlakesCount && timestamp - this.lastFlakeTime > FLAKE_ADDING_INTERVAL) {
      addSnowFlakes(this.flakes, this.canvas!.width, 2);
      this.lastFlakeTime = timestamp;
    }

    if (!this.isSnowFalling && this.flakes.length > 0) {
      this.flakes.length = this.flakes.length - Math.ceil(this.flakes.length / 100);
    }
  }

  private handleFlakeRespawn(flake: Flake) {
    if (this.isSnowFalling) {
      if (flake.y >= this.canvas!.height || flake.y <= 0) {
        respawnFlake(flake, this.canvas!.width);
      }

      if (flake.x >= this.canvas!.width || flake.x <= 0) {
        respawnFlake(flake, this.canvas!.width);
      }
    }
  }

  private renderSnow(timestamp: number) {
    if (!this.ctx || !this.canvas) {
      return;
    }
    // Skip frame, keep 60 FPS
    if (timestamp - this.lastFrameTime < FRAME_DURATION) {
      requestAnimationFrame(this.renderSnow.bind(this));
      return;
    }
    this.lastFrameTime = timestamp;
    this.adjustFlakesCount(timestamp);

    if (!this.isSnowFalling && this.flakes.length === 0) {
      this.clean();
      return;
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = 0; i < this.flakes.length; i++) {
      const flake = this.flakes[i] as Flake;
      this.applyForces(flake);
      this.handleFlakeRespawn(flake);
      this.drawSnowflake(flake);
    }

    requestAnimationFrame(this.renderSnow.bind(this));
  }

  start() {
    this.calculateMaxFlakesCount(window.innerWidth, window.innerHeight);
    this.isSnowFalling = true;
    if (!this.canvas) {
      this.createCanvas();
    }

    this.stopTimeoutId = window.setTimeout(this.autoStop.bind(this), SNOWFALL_TIMEOUT);

    document.addEventListener('mouseleave', this.onMouseLeave);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('resize', this.onResizeDebounced);

    if (!this.isRunning) {
      this.isRunning = true;
      this.renderSnow.call(this, this.lastFrameTime);
    }
  }

  stop() {
    window.removeEventListener('resize', this.onResizeDebounced);
    window.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseleave', this.onMouseLeave);
    this.isSnowFalling = false;
    clearTimeout(this.stopTimeoutId);
  }
}
