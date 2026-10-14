package com.meetu.backend.config;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Configuration
public class TimeJsonConfig {
    private static final ZoneId ZONE = ZoneId.of("Asia/Shanghai");

    @Bean
    Jackson2ObjectMapperBuilderCustomizer shanghaiInstants() {
        return builder -> builder.serializerByType(Instant.class, new JsonSerializer<Instant>() {
            @Override
            public void serialize(Instant value, JsonGenerator generator, SerializerProvider provider) throws IOException {
                generator.writeString(DateTimeFormatter.ISO_OFFSET_DATE_TIME.format(value.atZone(ZONE)));
            }
        });
    }
}
