import io.ktor.server.websocket.*
import java.nio.ByteBuffer
import java.util.*

class Gamer(
	val connection : DefaultWebSocketServerSession,
	var id : Int = 0,
	var color : Color = Color(0, 0, 0),
	var name : String = "Player $id", var team : Int = 0) {
	var cursorLocation  = CursorLocation(0f, 0f)
	var cursorUpdated = false
	var hasLost = false
}

data class Color(val r : Byte, val g : Byte, val b : Byte) {
	companion object  {
		fun random() : Color {
			val r = Random()
			return Color(
				r.nextInt(Byte.MIN_VALUE.toInt(), Byte.MAX_VALUE.toInt()).toByte(),
				r.nextInt(Byte.MIN_VALUE.toInt(), Byte.MAX_VALUE.toInt()).toByte(),
				r.nextInt(Byte.MIN_VALUE.toInt(), Byte.MAX_VALUE.toInt()).toByte())
		}
	}
}

fun ByteBuffer.getColor() = Color(get(), get(), get())
fun ByteBuffer.putColor(c : Color) {
	put(c.r)
	put(c.g)
	put(c.b)
}

data class CursorLocation(var x : Float, var y : Float)

fun ByteBuffer.getCursorLocation() = CursorLocation(getFloat(), getFloat())
fun ByteBuffer.putCursorLocation(loc : CursorLocation) {
	putFloat(loc.x)
	putFloat(loc.y)
}