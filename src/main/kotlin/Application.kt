import io.ktor.server.application.*
import io.ktor.server.netty.*
import io.ktor.server.routing.*
import io.ktor.server.websocket.*
import java.time.Duration

fun main(args : Array<String>) {
	EngineMain.main(args)
}

fun Application.module() {
	routing {  }
	install(WebSockets) {
		pingPeriod = Duration.ofSeconds(15)
		timeout = Duration.ofSeconds(15)
		maxFrameSize = Long.MAX_VALUE
		masking = false
	}
	val handler  = SessionHandler()
	routing {
		webSocket("/") {
			println("Gamer connected")
			var gamer : Gamer? = null
			try {
				for (frame in incoming) {
					val type = frame.buffer.get()
					if (gamer == null && type != 50.toByte()) continue

					when (type) {
						1.toByte() -> handler.onTeamCreateMessage(gamer ?: continue, frame.buffer)
						2.toByte() -> handler.onTeamRemoveMessage(gamer ?: continue, frame.buffer)
						3.toByte() -> handler.onGamerNameUpdateMessage(gamer ?: continue, frame.buffer)
						4.toByte() -> handler.onGamerColorUpdateMessage(gamer ?: continue, frame.buffer)
						5.toByte() -> handler.onGamerTeamUpdateMessage(gamer ?: continue, frame.buffer)
						6.toByte() -> handler.onSettingUpdateMessage(gamer ?: continue, frame.buffer)
						7.toByte() -> handler.onGameStartMessage(gamer ?: continue, frame.buffer)
						8.toByte() -> handler.onSquareRevealMessage(gamer ?: continue, frame.buffer)
						9.toByte() -> handler.onSquareFlagMessage(gamer ?: continue, frame.buffer)
						10.toByte() -> handler.onCursorUpdateMessage(gamer ?: continue, frame.buffer)
						11.toByte() -> handler.onTeamNameUpdateMessage(gamer ?: continue, frame.buffer)

						50.toByte() -> gamer = handler.onGamerJoin(this, frame.buffer)

						else -> println("unknown message")
					}
				}
			} catch (e: Exception) {
				println(e.localizedMessage)
			} finally {
				handler.onGamerLeave(gamer)
			}
		}
	}
}