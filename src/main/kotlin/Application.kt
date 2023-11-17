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
			println("User connected")
			var gamer : Gamer? = null
			try {
				for (frame in incoming) {
					val type = frame.buffer.get()
					if (gamer == null && type != 50.toByte()) continue

					when (type) {
						1.toByte() -> handler.onCreateTeamMessage(gamer ?: continue, frame.buffer)
						2.toByte() -> handler.onRemoveTeamMessage(gamer ?: continue, frame.buffer)
						3.toByte() -> handler.onChangeNameMessage(gamer ?: continue, frame.buffer)
						4.toByte() -> handler.onChangeUserColorMessage(gamer ?: continue, frame.buffer)
						5.toByte() -> handler.onJoinTeamMessage(gamer ?: continue, frame.buffer)
						6.toByte() -> handler.onChangeSettingMessage(gamer ?: continue, frame.buffer)
						7.toByte() -> handler.onStartGameMessage(gamer ?: continue, frame.buffer)
						8.toByte() -> handler.onRevealSquareMessage(gamer ?: continue, frame.buffer)
						9.toByte() -> handler.onFlagSquareMessage(gamer ?: continue, frame.buffer)
						10.toByte() -> handler.onCursorLocationMessage(gamer ?: continue, frame.buffer)

						50.toByte() -> gamer = handler.onPlayerJoin(this, frame.buffer)

						else -> println("unknown message")
					}
				}
			} catch (e: Exception) {
				println(e.localizedMessage)
			} finally {
				handler.onPlayerLeave(gamer)
			}
		}
	}
}