package io.cloudbeaver;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(value = {ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface WebObjectId {
}
