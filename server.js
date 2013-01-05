var app = require('http').createServer(), io = require('socket.io').listen(app), // app & io
	interval = 10 * 1000, waiting = 5 * 1000, heartbeat_interval = 60 * 1000, // times in ms
	connections = [], names = {}, signs = {}, disallowed = [], port = 80, game_on = false; // additions

app.listen(port);

// CALLED BY USER
io.sockets.on('connection', function(socket){
	connections.push(socket); // and push it in the array
	broadcast('online', connections.length); // broadcast the online number

	socket.on('disconnect', function() { // on disconnect
        connections.splice(connections.indexOf(socket), 1); // remove from the array
		delete names[socket.id];
		broadcast('online', connections.length); // broadcast the online number
    });

	socket.emit('id', socket.id);

	socket.on('name', function(name){
		names[socket.id] = name;
	});

	socket.on('sign', function(sign){
//		console.log('sign received');
		if(!game_on || disallowed.indexOf(socket.id) !== -1){
			return;
		}

//		console.log(socket.id, sign);
		signs[socket.id] = sign;
	});
});

// INITIATED BY THE SERVER
function init(){
	if(connections.length >= 2){
		game_on = true;
		broadcast('init', {interval: interval / 1000});
	}

	signs = {};
	setTimeout(end, interval);
}

function end(){
	if(game_on){
		game_on = false;
		broadcast('end');
		results();
	}

	setTimeout(init, waiting);
}

function broadcast(key, msg){
	for(var i in connections){
		connections[i].emit(key, msg);
	}
}

function results(){
	var result = {
		winners: [],
		data: copy(names)
	},
		state = {
		s: find_first(signs, 'scissors') !== -1,
		r: find_first(signs, 'rock') !== -1,
		p: find_first(signs, 'paper') !== -1
	},
		sum = state.s + state.r + state.p;

	switch(sum){
		case 2:
			result.winners = get_winners(state);
			add_disallowed(result);
			break;
		case 3:
			break;
		default: // case 1:
			disallowed = [];
	}

	check_reset(result);
	add_signs(result);
//	console.log(result);

	broadcast('result', result);
}

function copy(obj){
	var new_obj = {};
	for(var i in obj){
		new_obj[i] = obj[i];
	}
	return new_obj;
}

function check_reset(result){
	var winners = 0;
	for(var i in result.winners){
		winners++;
	}

	if(winners <= 1){
		disallowed = [];
	}
}

function add_disallowed(result){
	for(var i in result.data){
		var winner_found = false;

		for(var j in result.winners){
			if(result.winners[j].id === i){
				winner_found = true;
			}
		}

		if(!winner_found){
			disallowed.push(i);
		}
	}
}

function add_signs(result){
	for(var i in result.data){
		result.data[i] = {
			name: result.data[i],
			vote: signs[i] || '---'
		};
	}
}

function find_first(arr, word){
	for(var i in arr){
		if(arr[i] == word){
			return i;
		}
	}

	return -1;
}

function get_winners(state){
	var win = state.s && state.p ? 'scissors' : (state.r && state.p ? 'paper' : 'rock'),
		winners = [];

	for(var i in signs){
		if(signs[i] == win){
			winners.push({
				id: i,
				name: names[i]
			});
		}
	}

	return winners;
}

function heartbeat(){
	broadcast('online', connections.length);

	setTimeout(heartbeat, heartbeat_interval);
}

init();
heartbeat();
