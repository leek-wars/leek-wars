var LISTEN_DATA = 15
var STATS_NEW_THREAD = 16
var STAT_UPDATE_THREAD = 17
var STAT_UPDATE_TASK = 18

LW.pages.admin_servers.init = function(params, $scope, $page) {

	LW.socket.send([LISTEN_DATA])

	$page.render()
	LW.setTitle("Admin serveur")
}

LW.pages.admin_servers.wsreceive = function(params) {

	var type = params.type
	var data = params.data

	if (type == STATS_NEW_THREAD || type == STAT_UPDATE_THREAD) {
		for (var t in data) {
			var th = data[t];
			updateThread(th.server, th.name, th.connected, th.task, th.task_start, th.generated, th.errors);
		}
	}

	if (type == STAT_UPDATE_TASK) {
		data = data[0];
		updateThreadTask(data.name, data.task, data.task_start, data.generated, data.errors);
	}
}

function updateThread(server, thread, connected, task, task_start, generated, errors, last_connection, last_deconnetion, first_connection, deconnection) {

	// create server if not exists
	if ($('#' + server).length == 0) {

		var div = "<div id='" + server + "' class='server'>";
		div += "<div class='load'><div></div></div>";
		div += "<img src='" + LW.staticURL + "/image/admin/server.png'></img><br>";
		div += "<div class='name'>" + server + "<img src='" + LW.staticURL + "/image/connected.png'></img> </div>";
		div += "<div class='total-wrapper'>Total : <span class='total'></span></div>";
		div += "<div class='threads'></div>";
		div += "</div>";

		$($('#servers .column')[rand3()]).append(div);
	}

	var serverDiv = $('#' + server);

	if ($('#thread-' + thread).length == 0) {

		var th = "<div id='thread-" + thread + "' class='thread'>";
		th += "<div class='th-name'><img src='" + LW.staticURL + "/image/connected.png'></img>&nbsp;&nbsp;<b>" + thread + "</b></div>";
		th += "<green>✔ <span class='generated' generated='" + generated + "'>" + generated + "</span></green>&nbsp; ";
		th += "<red>✘ <span class='error' generated='" + errors + "'>" + errors + "</span></red><br>";
		th += "► <span class='task'>" + task + "</span>";
		th += "</div>";

		serverDiv.find('.threads').append(th);
	}

	var threadDiv = $('#thread-' + thread);
	if (connected) {
		threadDiv.find('img').attr('src', LW.staticURL + '/image/connected.png');
	} else {
		threadDiv.find('img').attr('src', LW.staticURL + '/image/disconnected.png');
	}

	updateServer(serverDiv);

	setTimeout(function() {
		updateColumns();
	}, 500);
}

function updateThreadTask(thread, task, task_start, generated, errors) {

	var threadDiv = $('#thread-' + thread);

	threadDiv.find('.task').text(task);
	threadDiv.find('.generated').attr('generated', generated);
	threadDiv.find('.generated').html(_.format.number(generated))

	updateServer(threadDiv.closest('.server'));
}

function updateServer(server) {

	// Total
	var total = 0;
	server.find('.thread').each(function() {
		total += parseInt($(this).find('.generated').attr('generated'));
	});
	server.find('.total').html(_.format.number(total));

	// Load
	var threads = server.find('.thread').length;
	var active = 0;
	server.find('.thread').each(function() {
		if ($(this).find('.task').text() == "") active++;
	});
	server.find('.load div').css('margin-top', (active / threads) * 136);
}

function rand3() {
	return Math.floor(Math.random() * 3);
}

function updateColumns() {

	var servers = [];

	for (var i = 0; i < 3; ++i) {

		var c = $($('#servers .column')[i]);

		var h = c.height();

		c.find('.server').each(function() {
			servers.push({elem: $(this), size: $(this).height()});
		});

		c.empty();
	}

	var secure = 0;

	while (servers.length > 0 && secure++ < 100) {
		var max = -1;
		var maxi;
		var maxix;
		for (var s in servers) {
			if (servers[s].size > max) {
				max = servers[s].size;
				maxi = servers[s];
				maxix = s;
			}
		}

		servers.splice(maxix, 1);

		var min = 999999;
		var mini;
		for (var i = 0; i < 3; ++i) {
			var c = $($('#servers .column')[i]);
			if (c.height() < min) {
				min = c.height();
				mini = c;
			}
		}
		mini.append(maxi.elem);
	}
}
