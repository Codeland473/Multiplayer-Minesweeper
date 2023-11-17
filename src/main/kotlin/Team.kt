class Team(var name : String, val id : Int = nextID++) {
	var boardMask : BooleanArray? = null
	var flagStates : IntArray? = null
	private companion object {
		var nextID : Int = 1
	}
}