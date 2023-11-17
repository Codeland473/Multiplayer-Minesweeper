import java.nio.ByteBuffer

fun ByteBuffer.getCString() : String {
	val s = StringBuilder()
	var c = getChar()
	while (c != Char.MIN_VALUE) {
		s.append(c)
		if (!hasRemaining()) break
		c = getChar()
	}
	return s.toString()
}

fun ByteBuffer.putCString(s : String) {
	for (char in s) {
		putChar(char)
	}
	put(0)
}