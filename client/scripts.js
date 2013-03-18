socket = io.connect('http://141.0.170.38:22580/'),
game_on = false;

user = {
	authenticate: function(){
		var user_name = '',
			i = 0;

		while(!user_name.length && i < 25){
			user_name = prompt('Enter your name');
			i++;
		}

		if(user_name.length){
			socket.emit('name', user_name);
		}else{
			$('body').html('<h1>You are not allowed to play, bad guy!</h1>');
		}
	},
	name: '',
	id: ''
};

sign = {
	clicked: function(which){
		if(!game_on){
			return;
		}

		socket.emit('sign', $(which).attr('alt'));

		$('.sign').removeClass('active');
		$(which).addClass('active');
	}
};

$(document).ready(function(){

user.authenticate();

// ACTIONS
	$('.sign').click(function(){
		sign.clicked($(this));
	});
// END ACTIONS

// SOCKET
	socket.on('id', function(id){
		user.id = id;
	});

	socket.on('init', function(i){
		game_on = true;
		$('#status').html('Play!');
		$('#interval').html(i.interval);
		setTimeout(start_counter, 1000);
		$('#results').fadeOut('slow', function(){
			$('#winners, #winners_showed, #players').empty();
		});
	});

	socket.on('end', function(e){
		game_on = false;
		$('#status').html('Wait');
		$('.sign').removeClass('active');
	});

	socket.on('online', function(n){
		$('#online_number').html(n);
	});

	socket.on('log', function(data){
		console.log(data);
	});

	socket.on('name', function(name){
		user.name = name;
	});

	socket.on('result', function(data){
		$('#winners_holder').hide();

		if(data.winners.length){
			$('#winners').html(pluck(data.winners, 'name').join(', '));
			$('#winners_showed').html(data.data[data.winners[0].id].vote);
			$('#winners_holder').show();
		}

		var players = [];
		for(var i in data.data){
			players.push(data.data[i].name + ' (' + data.data[i].vote + ')<br />');
		}

		$('#players').html(players);
		$('#results').fadeIn('fast');
	});
// END SOCKET

	function start_counter(){
		var n = $('#interval').html() * 1 - 1;

		if(n > 0){
			$('#interval').html(n < 10 ? '0' + n : n);
			setTimeout(start_counter, 1000);
		}else{
			$('#interval').html('0');
		}
	}

	function pluck(arr, field){
		var ret = [];

		for(var i in arr){
			ret.push(arr[i][field]);
		}

		return ret;
	}
});
