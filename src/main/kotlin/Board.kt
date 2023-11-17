class Board(var mineCounts : ByteArray, var width : Int, var height : Int) {
	var startTime : Long = System.currentTimeMillis()

	fun currentTime() : Float = (System.currentTimeMillis() - startTime).toFloat() / 1000f
}