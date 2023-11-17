import io.ktor.server.websocket.*
import java.nio.ByteBuffer
import java.util.*
import kotlin.collections.LinkedHashSet

class SessionHandler {
	var nextID = 1

	val gamers = Collections.synchronizedSet<Gamer>(LinkedHashSet())

	fun onPlayerJoin(sender : DefaultWebSocketServerSession, message : ByteBuffer) : Gamer {
		val requestedID = message.getInt()
		val requestedColor = message.getColor()
		val name = message.getCString()
		val givenID = if (requestedID <= 0 || gamers.any {it.id == requestedID}) ++nextID else requestedID
		val color = if (requestedColor.r == 0 && requestedColor.g == 0 && requestedColor.b == 0)
			Color.random() else requestedColor

		val gamer = Gamer(sender, givenID, color, name)
		gamers += gamer
		// TODO Update new player
		return gamer
	}

	fun onCreateTeamMessage(sender : Gamer, message : ByteBuffer) {}
	fun onRemoveTeamMessage(sender : Gamer, message : ByteBuffer) {}
	fun onChangeNameMessage(sender : Gamer, message : ByteBuffer) {}
	fun onChangeUserColorMessage(sender : Gamer, message : ByteBuffer) {}
	fun onJoinTeamMessage(sender : Gamer, message : ByteBuffer) {}
	fun onChangeSettingMessage(sender : Gamer, message : ByteBuffer) {}
	fun onStartGameMessage(sender : Gamer, message : ByteBuffer) {}
	fun onRevealSquareMessage(sender : Gamer, message : ByteBuffer) {}
	fun onFlagSquareMessage(sender : Gamer, message : ByteBuffer) {}
	fun onCursorLocationMessage(sender : Gamer, message : ByteBuffer) {}

	fun onPlayerLeave(quitter : Gamer?) {
		quitter ?: return
		gamers -= quitter
	}
}