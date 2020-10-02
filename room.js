class Room {
	constructor(code="", host=null) {
		this.code = code;
		this.host = host;
		this.players = [];
		this.buzzed = false;
	}
}

module.exports = Room;