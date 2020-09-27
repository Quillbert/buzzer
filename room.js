class Room {
	constructor(code="", host=null) {
		this.code = code;
		this.host = host;
		this.players = [];
	}
}

module.exports = Room;