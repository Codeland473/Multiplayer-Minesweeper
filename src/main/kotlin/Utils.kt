import java.nio.ByteBuffer

fun ByteBuffer.getString() : String {
	val s = StringBuilder()
	val length = getShort()
	repeat(length.toInt()) {
		s.append(getChar())
	}
	return s.toString()
}

fun ByteBuffer.putString(s : String) {
	putShort(s.length.toShort())
	for (char in s) {
		putChar(char)
	}
}