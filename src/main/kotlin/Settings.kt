class Settings {
	var cursorUpdateRate : Int = 20
	var isNoGuessing : Boolean = true
	var isAllForOne : Boolean = false
	var boardWidth : Int = 30
	var boardHeight : Int = 20
	var mineCount : Int = 130

	fun copy() : Settings {
		val r = Settings()
		r.cursorUpdateRate = cursorUpdateRate
		r.isNoGuessing = isNoGuessing
		r.isAllForOne = isAllForOne
		r.boardWidth = boardWidth
		r.boardHeight = boardHeight
		r.mineCount = mineCount
		return r
	}
}

const val SETTING_UPDATE_RATE = 0
const val SETTING_IS_NO_GUESSING = 1
const val SETTING_IS_ALL_FOR_ONE = 2
const val SETTING_BOARD_SIZE = 3
const val SETTING_MINE_COUNT = 4