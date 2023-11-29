package board

import java.io.File
import java.nio.ByteBuffer
import kotlin.math.ceil

class BoardBuffer {

	val boardWidth : Int
	val boardHeight : Int
	var internalBuffer : ByteBuffer
	var size : Int private set

	val capacity : Int get() = (internalBuffer.capacity() - 4) / boardSize
	val boardSize : Int get() = ceil((boardWidth * boardHeight).toFloat() / 8f).toInt()

	constructor(width : Int, height : Int, initialCapacity : Int = 4) {
		boardWidth = width
		boardHeight = height
		internalBuffer = ByteBuffer.allocate(initialCapacity * boardSize + 4)
		size = 0

		internalBuffer.putShort(boardWidth.toShort())
		internalBuffer.putShort(boardHeight.toShort())
	}

	constructor(buffer : ByteBuffer) {
		boardWidth = buffer.getShort(0).toInt()
		boardHeight = buffer.getShort(2).toInt()
		internalBuffer = buffer
		size = capacity
	}

	constructor(path : String) : this(ByteBuffer.wrap(File(path).readBytes()))

	fun isEmpty() = size == 0

	fun increaseSize(newSize : Int = size + 1) {
		val newBuffer = ByteBuffer.allocate(boardSize * newSize)

		newBuffer.put(internalBuffer.array().sliceArray(0 until (4 + size * boardSize)))
	}

	operator fun set(offset : Int, b : Board) {
		internalBuffer.put(offset * boardSize + 4, b.toBytesCompact(false))
	}

	operator fun plusAssign(b : Board) {
		if (capacity < size + 1) increaseSize()
		set(size, b)
		size += 1
	}

	operator fun get(offset : Int) : Board {
		val b = Board(boardWidth, boardHeight)
		for (i in b.mineCounts.indices) {
			b.mineCounts[i] = (if (internalBuffer[offset * boardSize + 4 + i / 8].toInt() and (1 shl (i % 8)) > 0 ) 9 else 0).toByte()
		}
		b.setMinecounts()
		return b
	}
}