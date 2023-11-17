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

fun ByteBuffer.getBool() = get() != 0.toByte()

fun ByteBuffer.putBool(b : Boolean) {
	put(if (b) 1 else 0)
}

fun ByteBuffer.getBoolArray(size : Int) = BooleanArray(size) {getBool()}

fun ByteBuffer.putBoolArray(bs : BooleanArray) {
	for (b in bs) putBool(b)
}

fun ByteBuffer.getIntArray(size : Int) = IntArray(size) {getInt()}

fun ByteBuffer.putIntArray(ints : IntArray) {
	for (i in ints) putInt(i)
}