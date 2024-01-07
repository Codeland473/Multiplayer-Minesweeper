import kotlinx.html.*

class Settings {
	var cursorUpdateRate : Int = 20
	var isNoGuessing : Boolean = true
	var isAllForOne : Boolean = false
	var boardWidth : Int = 30
	var boardHeight : Int = 20
	var mineCount : Int = 130
	var countdownLength : Int = 5

	var flagProtectionTime : Int = 500

	var diffSolveRequirement : Int = 20
	var bruteSolveRequirement : Int = 2

	fun copy() : Settings {
		val r = Settings()
		r.cursorUpdateRate = cursorUpdateRate
		r.isNoGuessing = isNoGuessing
		r.isAllForOne = isAllForOne
		r.boardWidth = boardWidth
		r.boardHeight = boardHeight
		r.mineCount = mineCount
		r.countdownLength = countdownLength

		r.flagProtectionTime = flagProtectionTime

		r.diffSolveRequirement = diffSolveRequirement
		r.bruteSolveRequirement = bruteSolveRequirement
		return r
	}
}

fun HTML.settingsForm(currentValues : Settings) {
	body {
		form {
			action = "/settings"
			method = FormMethod.post
			val setting = {settingName : String, currentValue : Any ->
				val programName = settingName.replace(" ", "_").lowercase()
				label {
					attributes["for"] = programName
					text("$settingName: ($currentValue)")
				}
				br()
				input(InputType.text) {
					name = programName
					id = programName
					value = "$currentValue"
					placeholder = "$currentValue"
				}
				br()
				br()
			}

			setting("Board Width", currentValues.boardWidth)
			setting("Board Height", currentValues.boardHeight)
			setting("Mine Count", currentValues.mineCount)
			setting("Countdown Length", currentValues.countdownLength)
			setting("No Guessing", currentValues.isNoGuessing)
			setting("All For One", currentValues.isAllForOne)
			setting("Flag Protection Time", currentValues.flagProtectionTime)
			setting("Diff Solve Requirement", currentValues.diffSolveRequirement)
			setting("Brute Solve Requirement", currentValues.bruteSolveRequirement)
			setting("Cursor Update Rate", currentValues.cursorUpdateRate)

			input(InputType.submit) {
				value = "update settings"
			}
		}
	}
}

const val SETTING_UPDATE_RATE = 0
const val SETTING_IS_NO_GUESSING = 1
const val SETTING_IS_ALL_FOR_ONE = 2
const val SETTING_BOARD_SIZE = 3
const val SETTING_MINE_COUNT = 4
const val SETTING_COUNTDOWN_LENGTH = 5