
# Data types

Strings are a short followed by a byte array. The short specifies the length of the byte array (not including the 
prefix).

# Messages

the first char/byte in any message should be an id for what kind of message it is, as shown below.

Client -> Server

| ID  | Type                                    |
|-----|-----------------------------------------|
| 1   | [Team Create](#Creating-a-Team)         |
| 2   | [Team Remove](#Removing-a-Team)         |
| 3   | [Gamer Name Update](#Changing-Names)    |
| 4   | [Gamer Color Update](#Changing-Colors)  |
| 5   | [Gamer Team Update](#Changing-Teams)    |
| 6   | [Setting Update](#Changing-Settings)    |
| 7   | [Game Start](#Starting-Game)            |
| 8   | [Square Reveal](#Revealing-Squares)     |
| 9   | [Square Flag](#Flagging-Squares)        |
| 10  | [Cursor Update](#Cursor-Location)       |
| 11  | [Team Name Update](#Changing-Team-Name) |
| 50  | [Gamer Join](#Joining)                  |

Server -> Client events

| ID  | Type                                    |
|-----|-----------------------------------------|
| 1   | [Team Create](#Creating-a-Team)         |
| 2   | [Team Remove](#Removing-a-Team)         |
| 3   | [Gamer Name Update](#Changing-Names)    |
| 4   | [Gamer Color Update](#Changing-Colors)  |
| 5   | [Gamer Team Update](#Changing-Teams)    |
| 6   | [Setting Update](#Changing-Settings)    |
| 7   | [Game Start](#Starting-Game)            |
| 8   | [Square Reveal](#Revealing-Squares)     |
| 9   | [Square Flag](#Flagging-Squares)        |
| 10  | [Cursor Update](#Cursor-Location)       |
| 11  | [Team Name Update](#Changing-Team-Name) |
| 50  | [Gamer Join](#Update-New-Player)        |
| 51  | [Gamer Create](#Player-Joined)          |
| 52  | [Gamer Remove](#Player-Left)            |
| 53  | [Team Finish](#Team-Finished)           |
| 54  | [Gamer Lost](#Player-Lost)              |
| 55  | [Team Lost](#Team-Lost)                 |

### Creating a Team

#### Client -> Server
| Offset | Size     | Type   | Description                   |
|--------|----------|--------|-------------------------------|
| 0      | 1        | Byte   | Message type (Team Create: 1) |
| 1      | Variable | String | Team name                     |

#### Server -> Client
| Offset | Size     | Type   | Description                   |
|--------|----------|--------|-------------------------------|
| 0      | 1        | Byte   | Message type (Team Create: 1) |
| 1      | 4        | Int    | Team ID                       |
| 5      | 4        | Int    | Sender ID                     |
| 9      | Variable | String | Team name                     |

### Removing a Team

#### Client -> Server
| Offset | Size     | Type   | Description                   |
|--------|----------|--------|-------------------------------|
| 0      | 1        | Byte   | Message type (Team Remove: 2) |
| 1      | 4        | Int    | Team ID                       |

#### Server -> Client
| Offset | Size     | Type   | Description                   |
|--------|----------|--------|-------------------------------|
| 0      | 1        | Byte   | Message type (Team Remove: 2) |
| 1      | 4        | Int    | Team ID                       |
| 5      | 4        | Int    | Sender ID                     |

### Changing Names

#### Client -> Server
| Offset | Size     | Type   | Description                         |
|--------|----------|--------|-------------------------------------|
| 0      | 1        | Byte   | Message type (Gamer Name Update: 3) |
| 1      | Variable | String | New name                            |

#### Server -> Client
| Offset | Size     | Type   | Description                         |
|--------|----------|--------|-------------------------------------|
| 0      | 1        | Byte   | Message type (Gamer Name Update: 3) |
| 1      | 4        | Int    | User ID                             |
| 5      | Variable | String | New name                            |


### Changing Colors

#### Client -> Server
| Offset | Size | Type | Description                          |
|--------|------|------|--------------------------------------|
| 0      | 1    | Byte | Message type (Gamer Color Update: 4) |
| 1      | 4    | Int  | Red                                  |
| 5      | 4    | Int  | Green                                |
| 9      | 4    | Int  | Blue                                 |

#### Server -> Client
| Offset | Size | Type | Description                          |
|--------|------|------|--------------------------------------|
| 0      | 1    | Byte | Message type (Gamer Color Update: 4) |
| 1      | 4    | Int  | User ID                              |
| 5      | 4    | Int  | Red                                  |
| 9      | 4    | Int  | Green                                |
| 13     | 4    | Int  | Blue                                 |

### Changing Teams

Team 0 is spectating team. Users are automatically put on the spectator team when joining

#### Client -> Server
| Offset | Size | Type | Description                         |
|--------|------|------|-------------------------------------|
| 0      | 1    | Byte | Message type (Gamer Team Update: 5) |
| 1      | 4    | Int  | ID of team to join                  |

#### Server -> Client
| Offset | Size | Type | Description                         |
|--------|------|------|-------------------------------------|
| 0      | 1    | Byte | Message type (Gamer Team Update: 5) |
| 1      | 4    | Int  | User ID                             |
| 5      | 4    | Int  | ID of joined team                   |

### Changing Settings

Settings are Listed below

| ID  | Size | Type       | Description                                 |
|-----|------|------------|---------------------------------------------|
| 0   | 4    | Int        | Update rate of onscreen cursors (hz)        |
| 1   | 1    | Bool       | Is no guessing                              |
| 3   | 1    | Bool       | If a team loses when a member clicks a mine |
| 2   | 8    | (Int, Int) | Board size                                  |

#### Client -> Server
| Offset | Size      | Type      | Description                      |
|--------|-----------|-----------|----------------------------------|
| 0      | 1         | Byte      | Message type (Setting Update: 6) |
| 1      | 4         | Int       | Setting ID                       |
| 5      | Dependant | Dependant | New value of the setting         |

#### Server -> Client
| Offset | Size      | Type      | Description                      |
|--------|-----------|-----------|----------------------------------|
| 0      | 1         | Byte      | Message type (Setting Update: 6) |
| 1      | 4         | Int       | Setting ID                       |
| 5      | 4         | Int       | Sender ID                        |
| 9      | Dependant | Dependant | New value of the setting         |

### Starting Game

#### Board Format
each byte represents one square as if it was fully revealed. A Value of 9 means that it is a mine. Format is rows-first,
so [0, 1, 1, 0, 2, 9, 0, 2, 9] would be:

- 0 1 1 
- 0 2 9
- 0 2 9

#### Client -> Server

Nothing other than the message ID needs to be sent

#### Server -> Client
| Offset | Size      | Type       | Description                       |
|--------|-----------|------------|-----------------------------------|
| 0      | 1         | Byte       | Message type (Game Start: 7)      |
| 1      | 4         | Int        | Sender ID                         |
| 1      | 8         | (Int, Int) | Start position (-1, -1 if not NG) |
| 5      | Dependant | [byte]     | Board (described above)           |

### Revealing Squares

If the square specified is already revealed, then it should be interpreted as a chord. Protections for not chording
squares with insufficient or excess flags should be handled by the client. If a chord is done using incorrect flags, or
a mine is otherwise revealed 

#### Client -> Server
| Offset | Size | Type | Description                     |
|--------|------|------|---------------------------------|
| 0      | 1    | Byte | Message type (Square Reveal: 8) |
| 1      | 4    | Int  | x position of square            |
| 5      | 4    | Int  | y position of square            |

#### Server -> Client
| Offset | Size | Type | Description                     |
|--------|------|------|---------------------------------|
| 0      | 1    | Byte | Message type (Square Reveal: 8) |
| 1      | 4    | Int  | User ID                         |
| 5      | 4    | Int  | x position of square            |
| 9      | 4    | Int  | y position of square            |

### Flagging Squares

#### Client -> Server
| Offset | Size | Type | Description                                                       |
|--------|------|------|-------------------------------------------------------------------|
| 0      | 1    | Byte | Message type (Square Flag: 9)                                     |
| 1      | 4    | Int  | x position of square                                              |
| 5      | 4    | Int  | y position of square                                              |
| 9      | 1    | Bool | True if a flag should be added, False if a flag should be removed |
| 10     | 1    | Bool | Is Pencil flag                                                    |

#### Server -> Client
| Offset | Size | Type | Description                                                       |
|--------|------|------|-------------------------------------------------------------------|
| 0      | 1    | Byte | Message type (Square Flag: 9)                                     |
| 1      | 4    | Int  | User ID                                                           |
| 5      | 4    | Int  | x position of square                                              |
| 9      | 4    | Int  | y position of square                                              |
| 13     | 1    | Bool | True if a flag should be added, False if a flag should be removed |
| 14     | 1    | Bool | Is Pencil flag                                                    |

### Cursor Location
I'll let the exact meaning of the cursor positions be handled by the client.

#### Client -> Server
| Offset | Size | Type  | Description                      |
|--------|------|-------|----------------------------------|
| 0      | 1    | Byte  | Message type (Cursor Update: 10) |
| 1      | 4    | Float | x position of cursor             |
| 5      | 4    | Float | y position of cursor             |

#### Server -> Client
| Offset | Size     | Type                  | Description                      |
|--------|----------|-----------------------|----------------------------------|
| 0      | 1        | Byte                  | Message type (Cursor Update: 10) |
| 1      | 4        | Int                   | Number of cursors given          |
| 5      | Variable | [(Int, Float, Float)] | User ID, cursor X, cursor Y      |

### Changing Team Name

#### Client -> Server
| Offset | Size     | Type   | Description                         |
|--------|----------|--------|-------------------------------------|
| 0      | 1        | Byte   | Message type (Team Name Update: 11) |
| 1      | 4        | Int    | Team ID                             |
| 5      | Variable | String | Team name                           |

#### Server -> Client
| Offset | Size     | Type   | Description                         |
|--------|----------|--------|-------------------------------------|
| 0      | 1        | Byte   | Message type (Team Name Update: 11) |
| 1      | 4        | Int    | Team ID                             |
| 5      | 4        | Int    | Sender ID                           |
| 9      | Variable | String | Team name                           |

## Exclusive Messages (Client -> Server)

### Joining

Name must be specified, if user ID specified is negative, the server assigns an id. Similarly, a color will be specified
if the color given is #000000

| Offset | Size     | Type   | Description                   |
|--------|----------|--------|-------------------------------|
| 0      | 1        | Byte   | Message type (Gamer Join: 50) |
| 1      | 4        | Int    | User ID                       |
| 5      | 4        | Int    | Red                           |
| 9      | 4        | Int    | Green                         |
| 13     | 4        | Int    | Blue                          |
| 17     | Variable | String | Name                          |

## Exclusive Messages (Server -> Client)

### Update New Player

board specification is the same as in [Starting Game](#Board-Format), but revealed squares will be increased by 10. For
example, a square adjacent to no mines will be 10. Flag states are laid out the same as the board, and represent if that
square has been flagged, and if so by who. A value of zero means that the square is not flagged, otherwise it is the ID
of the player that placed the flag. Negative values represent pencil flags.

| Offset    | Size      | Type       | Description                                     |
|-----------|-----------|------------|-------------------------------------------------|
| 0         | 1         | Byte       | Message type (Gamer Join: 50)                   |
| 1         | 4         | Int        | Cursor update rate (hz)                         |
| 5         | 4         | Int        | Is no guessing                                  |
| 9         | 4         | Int        | If a team loses when a member clicks a mine     |
| 13        | 4         | Int        | Game timer                                      |
| 17        | 8         | (Int, Int) | Board size (x, y)                               |
| 25        | 4         | Int        | Number of players (p)                           |
| 29        | 4         | Int        | Number of teams (t)                             |
| 33        | 4         | Int        | ID of new user                                  |
| 37        | 4 * p     | [Int]      | Active player IDs                               |
| Dependant | 12 * p    | [Int]      | Player Colors                                   |
| Dependant | 4 * t     | [Int]      | Active team IDs                                 |
| Dependant | x * y     | [byte]     | Board (described above)                         |
| Dependant | x * y     | [byte]     | Revealed board mask (1 = revealed, 0 otherwise) |
| Dependant | 4 * x * y | [Int]      | Flag states (described above)                   |
| Dependant | Dependant | [String]   | Player Usernames                                |
| Dependant | Dependant | [String]   | Team Names                                      |


### Player Joined

| Offset | Size     | Type   | Description                     |
|--------|----------|--------|---------------------------------|
| 0      | 1        | Byte   | Message type (Gamer Create: 51) |
| 1      | 4        | Int    | User ID                         |
| 5      | 4        | Int    | Red                             |
| 9      | 4        | Int    | Green                           |
| 13     | 4        | Int    | Blue                            |
| 17     | Variable | String | Name                            |

### Player Left

| Offset | Size | Type | Description                     |
|--------|------|------|---------------------------------|
| 0      | 1    | Byte | Message type (Gamer Remove: 51) |
| 1      | 4    | Int  | ID of player that left          |

### Team Finished

| Offset | Size | Type | Description                    |
|--------|------|------|--------------------------------|
| 0      | 1    | Byte | Message type (Team Finish: 53) |
| 1      | 4    | Int  | ID of team that won            |

### Player Lost

| Offset | Size | Type | Description                   |
|--------|------|------|-------------------------------|
| 0      | 1    | Byte | Message type (Gamer Lost: 54) |
| 1      | 4    | Int  | ID of player that Lost        |

### Team Lost

| Offset | Size | Type | Description                  |
|--------|------|------|------------------------------|
| 0      | 1    | Byte | Message type (Team Lost: 55) |
| 1      | 4    | Int  | ID of player that Lost       |