import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    kotlin("jvm") version "1.8.10"
	application
}

group = "org.example"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
}

dependencies {
	//implementation("org.java-websocket", "Java-WebSocket")
	implementation("org.java-websocket:Java-WebSocket:1.5.4")

}

tasks.withType<KotlinCompile> {
    kotlinOptions.jvmTarget = "1.8"
}

application {
	mainClass.set("MainKt")
}