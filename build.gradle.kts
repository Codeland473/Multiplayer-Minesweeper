import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

val jvmTarget = "1.8"

plugins {
    kotlin("jvm") version "1.8.10"
	application
	id("io.ktor.plugin") version "2.3.6"
	id("com.github.johnrengelman.shadow") version "8.1.1"
}

group = "org.example"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
	maven { url = uri("https://maven.pkg.jetbrains.space/public/p/ktor/eap") }
}

dependencies {
	implementation("io.ktor:ktor-server-core-jvm")
	implementation("io.ktor:ktor-server-websockets-jvm")
	implementation("io.ktor:ktor-server-netty-jvm")
	implementation("org.slf4j", "slf4j-nop", "1.7.36")

}

tasks.withType<JavaCompile> {
	targetCompatibility = jvmTarget
}
tasks.withType<KotlinCompile> {
    kotlinOptions.jvmTarget = jvmTarget
}

application {
	mainClass.set("ApplicationKt")
}