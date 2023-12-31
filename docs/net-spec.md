
# Data types

Strings are a short followed by a byte array. The short specifies the length of the byte array (not including the 
prefix). Times are represented as Unix time in milliseconds

### BoardPos (8 bytes)

also used for board size, where x is width and y is height.

| Size | Type | Description |
|------|------|-------------|
| 4    | Int  | x           |
| 4    | Int  | y           |

### Settings (22 bytes)

| Size      | Type     | Description                                 |
|-----------|----------|---------------------------------------------|
| 4         | Int      | Cursor update rate (hz)                     |
| 1         | Bool     | Is no guessing                              |
| 1         | Bool     | If a team loses when a member clicks a mine |
| 8         | BoardPos | Board size (x, y)                           |
| 4         | Int      | Mine Count                                  |
| 4         | Int      | Countdown Length                            |

### Gamer

| Size      | Type           | Description            |
|-----------|----------------|------------------------|
| 4         | Int            | Id                     |
| 3         | Color          | Color                  |
| Dependant | String         | Name                   |
| 1         | Bool           | True if they have lost |
| 4         | Int            | Team                   |
| 8         | (Float, Float) | Cursor location        |
| 1         | Bool           | Is Connected           |

### Color (3 bytes)

| Size | Type  | Description   |
|------|-------|---------------|
| 1    | Byte  | Red channel   |
| 1    | Byte  | Green channel |
| 1    | Byte  | Blue channel  |

### Team

| Size      | Type   | Description                                           |
|-----------|--------|-------------------------------------------------------|
| 4         | Int    | Id                                                    |
| Dependant | String | Team name                                             |
| 1         | Bool   | True if team has finished                             |
| 1         | Bool   | True if team hs lost                                  |
| 8         | Long   | Time team finished/lost (0 if they have not finished) |

### TeamProgress

For the board, each byte represents one square as if it was fully revealed. A Value of 10 means that the square is not
revealed yet. Format is rows-first, so [0, 1, 1, 0, 2, 10, 0, 2, 10] would be:

- 0 1 1
- 0 2
- 0 2

Flag states are laid out the same as the board,
and represent if that square has been flagged, and if so by who. A value of zero means that the square is not flagged,
otherwise it is the ID of the gamer that placed the flag. Negative values represent pencil flags.

| Size      | Type   | Description             |
|-----------|--------|-------------------------|
| Dependant | [Byte] | board                   |
| Dependant | [Int]  | Flags (described above) |

### BoardStats (12 bytes)

| Size      | Type   | Description  |
|-----------|--------|--------------|
| 4         | Int    | 3BV          |
| 4         | Int    | Diff solves  |
| 4         | Int    | Brute solves |

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
| 12  | [Board Clear](#Ending-The-Game)         |
| 50  | [Gamer Join](#Joining)                  |
| 51  | [State Request](#Requesting-Game-State) |

Server -> Client events

| ID | Type                                    |
|----|-----------------------------------------|
| 1  | [Team Create](#Creating-a-Team)         |
| 2  | [Team Remove](#Removing-a-Team)         |
| 3  | [Gamer Name Update](#Changing-Names)    |
| 4  | [Gamer Color Update](#Changing-Colors)  |
| 5  | [Gamer Team Update](#Changing-Teams)    |
| 6  | [Setting Update](#Changing-Settings)    |
| 7  | [Game Start](#Starting-Game)            |
| 8  | [Square Reveal](#Revealing-Squares)     |
| 9  | [Square Flag](#Flagging-Squares)        |
| 10 | [Cursor Update](#Cursor-Location)       |
| 11 | [Team Name Update](#Changing-Team-Name) |
| 12 | [Board Clear](#Ending-The-Game)         |
| 50 | [Lobby State](#Lobby-State)             |
| 51 | [Gamer Create](#Gamer-Joined)           |
| 52 | [Gamer Remove](#Gamer-Left)             |
| 53 | [Team Finish](#Team-Finished)           |
| 54 | [Gamer Lost](#Gamer-Lost)               |
| 55 | [Board Stats](#Board-Stats)             |

### Creating a Team

#### Client -> Server

| Size     | Type   | Description                   |
|----------|--------|-------------------------------|
| 1        | Byte   | Message type (Team Create: 1) |
| Variable | String | Team name                     |

#### Server -> Client

| Size     | Type   | Description                   |
|----------|--------|-------------------------------|
| 1        | Byte   | Message type (Team Create: 1) |
| 4        | Int    | Team ID                       |
| 4        | Int    | Sender ID                     |
| Variable | String | Team name                     |

### Removing a Team

#### Client -> Server

| Size     | Type   | Description                   |
|----------|--------|-------------------------------|
| 1        | Byte   | Message type (Team Remove: 2) |
| 4        | Int    | Team ID                       |

#### Server -> Client

| Size     | Type   | Description                   |
|----------|--------|-------------------------------|
| 1        | Byte   | Message type (Team Remove: 2) |
| 4        | Int    | Team ID                       |
| 4        | Int    | Sender ID                     |

### Changing Names

#### Client -> Server

| Size     | Type   | Description                         |
|----------|--------|-------------------------------------|
| 1        | Byte   | Message type (Gamer Name Update: 3) |
| Variable | String | New name                            |

#### Server -> Client

| Size     | Type   | Description                         |
|----------|--------|-------------------------------------|
| 1        | Byte   | Message type (Gamer Name Update: 3) |
| 4        | Int    | gamer ID                            |
| Variable | String | New name                            |


### Changing Colors

#### Client -> Server

| Size | Type | Description                          |
|------|------|--------------------------------------|
| 1    | Byte | Message type (Gamer Color Update: 4) |
| 1    | Byte | Red                                  |
| 1    | Byte | Green                                |
| 1    | Byte | Blue                                 |

#### Server -> Client

| Size | Type | Description                          |
|------|------|--------------------------------------|
| 1    | Byte | Message type (Gamer Color Update: 4) |
| 4    | Int  | gamer ID                             |
| 1    | Byte | Red                                  |
| 1    | Byte | Green                                |
| 1    | Byte | Blue                                 |

### Changing Teams

Team 0 is spectating team. gamers are automatically put on the spectator team when joining

#### Client -> Server

| Size | Type | Description                         |
|------|------|-------------------------------------|
| 1    | Byte | Message type (Gamer Team Update: 5) |
| 4    | Int  | ID of team to join                  |

#### Server -> Client

| Size | Type | Description                         |
|------|------|-------------------------------------|
| 1    | Byte | Message type (Gamer Team Update: 5) |
| 4    | Int  | gamer ID                            |
| 4    | Int  | ID of joined team                   |

### Changing Settings

Settings are Listed below

| ID  | Size | Type     | Description                                 |
|-----|------|----------|---------------------------------------------|
| 0   | 4    | Int      | Update rate of onscreen cursors (hz)        |
| 1   | 1    | Bool     | Is no guessing                              |
| 2   | 1    | Bool     | If a team loses when a member clicks a mine |
| 3   | 8    | BoardPos | Board size                                  |
| 4   | 4    | Int      | Mine Count                                  |
| 5   | 4    | Int      | Countdown Length                            |

#### Client -> Server

| Size      | Type      | Description                      |
|-----------|-----------|----------------------------------|
| 1         | Byte      | Message type (Setting Update: 6) |
| 4         | Int       | Setting ID                       |
| Dependant | Dependant | New value of the setting         |

#### Server -> Client

| Size      | Type      | Description                      |
|-----------|-----------|----------------------------------|
| 1         | Byte      | Message type (Setting Update: 6) |
| 4         | Int       | Setting ID                       |
| 4         | Int       | Sender ID                        |
| Dependant | Dependant | New value of the setting         |

### Starting Game

#### Client -> Server

| Size     | Type   | Description                  |
|----------|--------|------------------------------|
| 1        | Byte   | Message type (Game Start: 7) |

#### Server -> Client

| Size | Type       | Description                                                |
|------|------------|------------------------------------------------------------|
| 1    | Byte       | Message type (Game Start: 7)                               |
| 4    | Int        | Sender ID                                                  |
| 8    | Long       | Start time (Unix time millis)                              |
| 8    | BoardPos   | Start position                                             |
| 22   | Settings   | Game Settings                                              |

### Revealing Squares

#### Client -> Server

| Size  | Type     | Description                     |
|-------|----------|---------------------------------|
| 1     | Byte     | Message type (Square Reveal: 8) |
| 8     | BoardPos | Position of square              |
| 1     | Boolean  | Is chord                        |

#### Server -> Client

When any of the mine counts is 9, the team should process this as a loss.

| Size      | Type     | Description                                                                                   |
|-----------|----------|-----------------------------------------------------------------------------------------------|
| 1         | Byte     | Message type (Square Reveal: 8)                                                               |
| 4         | Int      | Gamer ID                                                                                      |
| 4         | Int      | Team ID                                                                                       |
| 8         | BoardPos | Min x, y of newly revealed squares                                                            |
| 8         | BoardPos | Width, height of newly revealed squares                                                       |
| Dependant | [Byte]   | Mine counts for nearby mines, 10 if the state of the indicated square should remain unchanged |
| 8         | Long     | Time the action was processed                                                                 |

### Flagging Squares

#### Client -> Server

| Size | Type     | Description                                                       |
|------|----------|-------------------------------------------------------------------|
| 1    | Byte     | Message type (Square Flag: 9)                                     |
| 8    | BoardPos | position of square                                                |
| 1    | Bool     | True if a flag should be added, False if a flag should be removed |
| 1    | Bool     | Is Pencil flag                                                    |

#### Server -> Client

| Size | Type     | Description                                                       |
|------|----------|-------------------------------------------------------------------|
| 1    | Byte     | Message type (Square Flag: 9)                                     |
| 4    | Int      | gamer ID                                                          |
| 4    | Int      | team ID                                                           |
| 8    | BoardPos | position of square                                                |
| 1    | Bool     | True if a flag should be added, False if a flag should be removed |
| 1    | Bool     | Is Pencil flag                                                    |

### Cursor Location

I'll let the exact meaning of the cursor positions be handled by the client.

#### Client -> Server

| Size | Type  | Description                      |
|------|-------|----------------------------------|
| 1    | Byte  | Message type (Cursor Update: 10) |
| 4    | Float | x position of cursor             |
| 4    | Float | y position of cursor             |

#### Server -> Client

| Size     | Type                  | Description                      |
|----------|-----------------------|----------------------------------|
| 1        | Byte                  | Message type (Cursor Update: 10) |
| 4        | Int                   | Number of cursors given          |
| Variable | [(Int, Float, Float)] | gamer ID, cursor X, cursor Y     |

### Changing Team Name

#### Client -> Server

| Size     | Type   | Description                         |
|----------|--------|-------------------------------------|
| 1        | Byte   | Message type (Team Name Update: 11) |
| 4        | Int    | Team ID                             |
| Variable | String | Team name                           |

#### Server -> Client

| Size     | Type   | Description                         |
|----------|--------|-------------------------------------|
| 1        | Byte   | Message type (Team Name Update: 11) |
| 4        | Int    | Team ID                             |
| 4        | Int    | Sender ID                           |
| Variable | String | Team name                           |

### Ending The Game

When gamers are ready to move onto the next game or exit to lobby, one gamer should send an empty message with ID 12 
to the server. The server will then relay a similar message to all the gamers, this should clear the board and team 
progresses, as if the game hadn't started yet. Teams, users, and settings will remain unchanged.

#### Client -> Server

| Size     | Type   | Description                         |
|----------|--------|-------------------------------------|
| 1        | Byte   | Message type (Team Name Update: 12) |

#### Server -> Client

| Size      | Type    | Description                         |
|-----------|---------|-------------------------------------|
| 1         | Byte    | Message type (Team Name Update: 12) |
| 4         | Int     | Number of gamers still connected    |
| Dependant | [Gamer] | Connected gamers                    |

## Exclusive Messages (Client -> Server)

### Joining

Name must be specified, if gamer ID specified is 0, the server assigns an id. Similarly, a color will be specified
if the color given is #000000

| Size     | Type   | Description                   |
|----------|--------|-------------------------------|
| 1        | Byte   | Message type (Gamer Join: 50) |
| 4        | Int    | gamer ID                      |
| 4        | Int    | Team ID (0 if not on a team)  |
| 1        | Byte   | Red                           |
| 1        | Byte   | Green                         |
| 1        | Byte   | Blue                          |
| Variable | String | Name                          |

### Requesting Game State

If the client reaches an unrecoverable error state and needs to re-sync with the server they can send this message. When
the server receives this, it will send back a [Lobby State](#Lobby-State) message.

| Size     | Type   | Description                      |
|----------|--------|----------------------------------|
| 1        | Byte   | Message type (State Request: 51) |

## Exclusive Messages (Server -> Client)

### Lobby State

The team progresses will only show the state for the team the new gamer is on unless the gamer is on the spectator team,
in which case the gamer will be given all the board states for each team in the same order as the team IDs.

| Size      | Type           | Description                                                              |
|-----------|----------------|--------------------------------------------------------------------------|
| 1         | Byte           | Message type (Lobby State: 50)                                           |
| 22        | Settings       | Settings                                                                 |
| 4         | Int            | Number of gamers (g)                                                     |
| 4         | Int            | Number of teams (t)                                                      |
| 4         | Int            | ID of new gamer                                                          |
| Dependant | [Gamer]        | Active gamers                                                            |
| Dependant | [Team]         | Active teams                                                             |
| 1         | Bool           | True if a game is going (if false, the rest of this message is not sent) |
| 22        | Settings       | Current game settings                                                    |
| 8         | Long           | Game start time                                                          |
| 8         | BoardPos       | Start position                                                           |
| Dependant | [TeamProgress] | Each teams board progression                                             |
| 12        | BoardStats     | Board stats (only sent to spectators                                     |

### Gamer Joined

| Size      | Type  | Description                     |
|-----------|-------|---------------------------------|
| 1         | Byte  | Message type (Gamer Create: 51) |
| Dependant | Gamer | New gamer                       |

### Gamer Left

| Size | Type | Description                     |
|------|------|---------------------------------|
| 1    | Byte | Message type (Gamer Remove: 52) |
| 4    | Int  | ID of gamer that left           |

### Team Finished

| Size | Type | Description                            |
|------|------|----------------------------------------|
| 1    | Byte | Message type (Team Finish: 53)         |
| 4    | Int  | ID of team that finished               |
| 8    | Long | Unix time the server processed the win |

### Gamer Lost

If a team has not lost, then the team id will be 0. This message is not sent to team which lost. Instead that should be
handled by the client when they receive a square reveal message that has a mine in it.

| Size | Type | Description                   |
|------|------|-------------------------------|
| 1    | Byte | Message type (Gamer Lost: 54) |
| 4    | Int  | ID of gamer that Lost         |
| 4    | Int  | ID of team that Lost          |
| 8    | Long | Time the loss was processed   |

### Board Stats

When a team loses, stats become visible to the player about the board, they are listed here

| Size | Type       | Description                    |
|------|------------|--------------------------------|
| 1    | Byte       | Message type (Board Stats: 55) |
| 12   | BoardStats | statistics about the board     |