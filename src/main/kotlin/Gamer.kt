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
}

data class Color(val r : Int, val g : Int, val b : Int) {
	companion object  {
		fun random() : Color {
			val r = Random()
			return Color(r.nextInt(), r.nextInt(), r.nextInt())
		}
	}
}

fun ByteBuffer.getColor() = Color(getInt(), getInt(), getInt())
fun ByteBuffer.putColor(c : Color) {
	putInt(c.r)
	putInt(c.g)
	putInt(c.b)
}

data class CursorLocation(val x : Float, val y : Float)

fun ByteBuffer.getCursorLocation() = CursorLocation(getFloat(), getFloat())
fun ByteBuffer.putCursorLocation(loc : CursorLocation) {
	putFloat(loc.x)
	putFloat(loc.y)
}