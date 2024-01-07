import io.ktor.server.application.*
import io.ktor.server.html.*
import io.ktor.server.http.content.*
import io.ktor.server.netty.*
import io.ktor.server.request.*
import io.ktor.server.routing.*
import io.ktor.server.websocket.*
import kotlinx.html.*
import java.io.File
import java.nio.ByteOrder
import java.time.Duration

fun main(args : Array<String>) {
	EngineMain.main(args)
}

fun Application.module() {
	val handler  = SessionHandler()
	routing {
		staticFiles("/", File("run/page"))
		get("/settings") {
			call.respondHtml {
				settingsForm(handler.settings)
			}
		}
		post("/settings") {
			handler.onSettingsFormUpdate(call.receiveParameters())
		}
	}
	install(WebSockets) {
		pingPeriod = Duration.ofSeconds(15)
		timeout = Duration.ofSeconds(15)
		maxFrameSize = Long.MAX_VALUE
		masking = false
	}
	routing {
		webSocket("/") {
			println("Gamer connected")
			var gamer : Gamer? = null
			try {
				for (frame in incoming) {
					val type = frame.buffer.get()
					frame.buffer.order(ByteOrder.BIG_ENDIAN)
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
						12.toByte() -> handler.onBoardClearMessage(gamer ?: continue, frame.buffer)

						50.toByte() -> if (gamer == null) gamer = handler.onGamerJoin(this, frame.buffer)
						51.toByte() -> handler.onStateRequest(gamer ?: continue, frame.buffer)

						else -> println("unknown message")
					}
				}
			} catch (e: Exception) {
				e.printStackTrace()
			} finally {
				handler.onGamerLeave(gamer)
			}
		}
	}
}