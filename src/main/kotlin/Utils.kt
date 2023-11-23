import java.nio.ByteBuffer

fun ByteBuffer.getString() : String {
	val length = getShort()
	return String(ByteArray(length.toInt()) {get()})
}

fun ByteBuffer.putString(s : String) {
	val bytes = s.toByteArray()
	putShort(bytes.size.toShort())
	put(bytes)
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