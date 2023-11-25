# Table of Contents

- [Building](#Building)
  - [Web](#Web)
  - [Server](#Server)
- [Documentation Links](#Documentation-Links)

# Building

The project is split between the Web project and the server backend. The server will serve everything in `run/page/`, 
which is built by the project located in `web/`.

## Web

## Server

To run the server, simply run `gralde run`. If gradle is not installed or the current version is outdated, the wrappers 
`./gradlew` or `./gradlew.bat` can be used in place of `gralde`. To compile a jar, `gradle shadowJar` compiles a
runnable jar at `build/libs/MinesweeperServer-all.jar`.


# Documentation Links
| Links                                                                   |
|-------------------------------------------------------------------------|
| [Network specification](docs/net-spec.md)                               |
| [NG board generation algorithm](docs/board-gen.md)                      |
| [NG Board generation performance summary](docs/performance-summary.csv) |