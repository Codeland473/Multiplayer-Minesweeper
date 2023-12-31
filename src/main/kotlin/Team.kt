import board.Board

class Team(var name : String, val id : Int = nextID++) {
	var progress : TeamProgress? = null

	var hasLost : Boolean = false
	var hasFinished : Boolean = false
	var endTime : Long? = null

	fun reset() {
		progress = null
		hasLost = false
		hasFinished = false
		endTime = null
	}

	private companion object {
		var nextID : Int = 1
	}
}

class TeamProgress(width : Int, height : Int) {

	constructor(board : Board) : this(board.width, board.height)

	var boardMask : BooleanArray = BooleanArray(width * height) {false}
	var flagStates : IntArray = IntArray(width * height) {0}
	var flagTimes : LongArray = LongArray(width * height) {0}
}