import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    kotlin("jvm") version "1.8.10"
	application
	id("io.ktor.plugin") version "2.3.6"
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
	implementation("ch.qos.logback:logback-classic:1.4.11")

}

tasks.withType<KotlinCompile> {
    kotlinOptions.jvmTarget = "17"
}

application {
	mainClass.set("ApplicationKt")
}