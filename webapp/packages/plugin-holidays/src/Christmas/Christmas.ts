/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable } from 'mobx';

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
  opacity: number;
};

function addSnowFlakes(flakes: Flake[], width: number, count: number = 1) {
  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * width),
      y = 0,
      size = Math.random() * 3 + 2,
      speed = Math.random() * 1 + 0.33,
      opacity = Math.random() * 0.5 + 0.3;

    flakes.push({
      speed: speed,
      velY: speed,
      velX: 0,
      x: x,
      y: y,
      size: size,
      stepSize: Math.random() / 30,
      step: 0,
      angle: 180,
      opacity: opacity,
    });
  }
}

function respawnFlake(flake: Flake) {
  flake.y = 0;
  flake.speed = Math.random() * 0.5 + 0.4;
  flake.velY = flake.speed;
  flake.velX = 0;
  flake.opacity = Math.random() * 0.5 + 0.3;
}

const MIN_EFFECTIVE_DISTANCE = 450;
const FRAME_DURATION = 1000 / 60; // 60 FPS
const FLAKE_ADDING_INTERVAL = 100; //ms
const SNOWFALL_TIMEOUT = 60000; // 1 minute

export class Christmas {
  private isResizing = false;
  private isMouseMoving = false;
  private flakes: Flake[] = [];
  private lastFrameTime = 0;
  private lastFlakeTime = 0;
  private mX = -300;
  private mY = -300;
  private ctx: CanvasRenderingContext2D | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private maxFlakesCount = 0;
  private stopTimeoutId: number | undefined = undefined;
  public isSnowFalling = false;

  constructor() {
    makeObservable(this, {
      isSnowFalling: observable,
      start: action,
      stop: action,
    });
  }

  calculateMaxFlakesCount(width: number, height: number) {
    const baseFlakesCount = 330;
    const baseArea = 1920 * 1080;
    const currentArea = width * height;
    this.maxFlakesCount = Math.round((currentArea / baseArea) * baseFlakesCount);
  }

  createCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.canvas.id = 'christmas';
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '1';
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
  }

  handleResize = () => {
    if (!this.isResizing) {
      this.isResizing = true;
      setTimeout(() => {
        this.isResizing = false;
      }, 600);
    }
  };

  handleMouseMove = () => {
    if (!this.isMouseMoving) {
      this.isMouseMoving = true;
      setTimeout(() => {
        this.isMouseMoving = false;
      }, 200);
    }
  };

  onResize = () => {
    this.handleResize();
    this.calculateMaxFlakesCount(window.innerWidth, window.innerHeight);
    if (this.canvas) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
  };

  onMouseMove = (e: MouseEvent) => {
    this.handleMouseMove();
    this.mX = e.clientX;
    this.mY = e.clientY;
  };

  onMouseLeave = () => {
    this.mX = -300;
    this.mY = -300;
  };

  autoStop = () => {
    if (this.isSnowFalling) {
      this.stop();
    }
  };

  snow = (timestamp: number) => {
    if (!this.ctx || !this.canvas) {
      return;
    }

    if (
      this.isSnowFalling &&
      !this.isResizing &&
      this.flakes.length < this.maxFlakesCount &&
      timestamp - this.lastFlakeTime > FLAKE_ADDING_INTERVAL
    ) {
      addSnowFlakes(this.flakes, this.canvas.width, 2);
      this.lastFlakeTime = timestamp;
    }

    if (!this.isSnowFalling && this.flakes.length > 0) {
      this.flakes.pop();
    }

    if (!this.isSnowFalling && this.flakes.length === 0) {
      if (this.canvas) {
        document.body.removeChild(this.canvas);
        this.canvas = null;
        this.ctx = null;
      }
      return;
    }

    if (timestamp - this.lastFrameTime < FRAME_DURATION) {
      requestAnimationFrame(this.snow);
      return;
    }
    this.lastFrameTime = timestamp;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = 0; i < this.flakes.length; i++) {
      const flake = this.flakes[i]!;

      const x = this.mX;
      const y = this.mY;
      const x2 = flake.x;
      const y2 = flake.y;

      const dx = x2 - x;
      const dy = y2 - y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < MIN_EFFECTIVE_DISTANCE && dist > 20 && this.isMouseMoving) {
        const force = MIN_EFFECTIVE_DISTANCE / ((dist * dist) / 5);

        const xcomp = (x - x2) / dist;
        const ycomp = (y - y2) / dist;
        const deltaV = force / 2;

        flake.velX += deltaV * xcomp;
        flake.velY += deltaV * ycomp;
      } else {
        if (flake.velY < flake.speed) {
          flake.velY = flake.speed;
        }
        flake.velX += Math.cos((flake.step += Math.random() * 0.03)) * flake.stepSize;
      }

      flake.velY = Math.min(flake.velY, 5);

      flake.velX *= 0.98;
      flake.velY *= 0.99;

      this.ctx.fillStyle = flake.velY > 2 ? 'rgba(187,238,255,1)' : 'rgba(153,204,255,' + flake.opacity + ')';
      flake.y += flake.velY;
      flake.x += flake.velX;

      if (this.isSnowFalling && !this.isResizing) {
        if (flake.y >= this.canvas.height || flake.y <= 0) {
          respawnFlake(flake);
        }

        if (flake.x >= this.canvas.width || flake.x <= 0) {
          respawnFlake(flake);
        }
      }

      this.ctx.beginPath();
      this.ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    requestAnimationFrame(this.snow);
  };

  start = action(() => {
    this.calculateMaxFlakesCount(window.innerWidth, window.innerHeight);
    this.isSnowFalling = true;
    if (!this.canvas) {
      this.createCanvas();
    }

    this.stopTimeoutId = window.setTimeout(this.autoStop, SNOWFALL_TIMEOUT);

    document?.addEventListener('mouseleave', this.onMouseLeave);
    window?.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('resize', this.onResize);

    this.snow(this.lastFrameTime);
  });

  stop = action(() => {
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseleave', this.onMouseLeave);
    this.isSnowFalling = false;
    clearTimeout(this.stopTimeoutId);
  });
}
