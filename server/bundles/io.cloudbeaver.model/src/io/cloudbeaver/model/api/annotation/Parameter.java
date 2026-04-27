/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package io.cloudbeaver.model.api.annotation;

import io.cloudbeaver.model.api.annotation.enums.Explode;
import io.cloudbeaver.model.api.annotation.enums.ParameterIn;
import io.cloudbeaver.model.api.annotation.enums.ParameterStyle;
import io.cloudbeaver.model.api.annotation.media.ArraySchema;
import io.cloudbeaver.model.api.annotation.media.Schema;

import java.lang.annotation.*;

@Repeatable(Parameters.class)
@Retention(RetentionPolicy.RUNTIME)
@Target({ ElementType.PARAMETER, ElementType.METHOD, ElementType.FIELD, ElementType.ANNOTATION_TYPE })
public @interface Parameter {

	String name() default "";

	String description() default "";

	boolean required() default false;

	String example() default "";

	ParameterIn in() default ParameterIn.DEFAULT;

	Schema schema() default @Schema;

	ArraySchema array() default @ArraySchema;

	ParameterStyle style() default ParameterStyle.DEFAULT;

	Explode explode() default Explode.DEFAULT;

	boolean hidden() default false;
}
