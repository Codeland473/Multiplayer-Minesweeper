package messages

import Color
import CursorLocation
import Gamer
import Settings
import Team
import TeamProgress
import board.Board
import java.nio.ByteBuffer
import java.nio.ByteOrder
import kotlin.text.toByteArray

class MessageBuffer(private val initialMax : Int = 1024) {
	private val internalBuffers = arrayListOf(ByteBuffer.allocate(initialMax))
	val buffer : ByteBuffer get() = internalBuffers.last()

	init {
		buffer.order(ByteOrder.BIG_ENDIAN)
	}

	private fun addBuffer() {
		val new = ByteBuffer.allocate(initialMax)
		new.order(ByteOrder.BIG_ENDIAN)
		internalBuffers.add(new)
	}

	fun coherentArray() : ByteArray {
		val size = internalBuffers.sumOf { it.position() }
		val ret = ByteBuffer.allocate(size)
		for (buffer in internalBuffers) {
			repeat(buffer.position()) {ret.put(buffer.get(it))}
		}
		return ret.array()
	}

	fun reset() {
		while (internalBuffers.size > 1) internalBuffers.removeLastOrNull()
		internalBuffers[0].position(0)
	}

	fun <T> putFun(size : Int, f : ByteBuffer.() -> T) {
		if (buffer.remaining() < size) addBuffer()
		buffer.f()
	}

	fun put(v : Byte) {
		if (buffer.remaining() < 1) addBuffer()
		buffer.put(v)
	}

	fun put(v : ByteArray) {
		if (v.size > buffer.remaining()) {
			val remaining = buffer.remaining()
			buffer.put(v.sliceArray(0 until remaining))
			addBuffer()
			put(v.sliceArray(remaining until v.size))
		} else {
			buffer.put(v)
		}
	}

	fun put(v : Int) = putFun(4) { putInt(v) }
	fun put(v : Long) = putFun(8) { putLong(v) }
	fun put(v : Float) = putFun(4) { putFloat(v) }
	fun put(v : Short) = putFun(4) { putShort(v) }
	fun put(v : Boolean) = put(if (v) 1.toByte() else 0.toByte())
	fun put(v : String) {
		val arr = v.toByteArray()
		put(arr.size.toShort())
		put(v.toByteArray())
	}

	fun put(v : Color) {
		put(v.r)
		put(v.g)
		put(v.b)
	}
	fun put(v : CursorLocation) {
		put(v.x)
		put(v.y)
	}
	fun put(v : Settings) {
		put(v.cursorUpdateRate)
		put(v.isNoGuessing)
		put(v.isAllForOne)
		put(v.boardWidth)
		put(v.boardHeight)
		put(v.mineCount)
		put(v.countdownLength)
	}
	fun put(v : Gamer) {
		put(v.id)
		put(v.color)
		put(v.name)
		put(v.hasLost)
		put(v.team)
		put(v.cursorLocation)
		put(v.isConnected)
	}

	fun put(v : TeamProgress, board : Board) {
		v.boardMask.indices.forEach {
			put(when (v.boardMask[it]) {
				true -> board[it]
				false -> 10.toByte()
			})
		}
		put(v.flagStates)
	}

	fun put(v : Team) {
		put(v.id)
		put(v.name)
		put(v.hasFinished)
		put(v.hasLost)
		put(v.endTime ?: -1L)
	}

	fun put(v : BooleanArray) {
		for (value in v) put(value)
	}
	fun put(v : IntArray) {
		for (value in v) put(value)
	}
}
