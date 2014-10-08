(function() {
	ptmTestViewer = new Object();
	ptmTestViewer.tests = {};
	ptmTestViewer.artifactsRepository = 'http://prfci100.dev.sabre.com:8040/artifacts/';
	ptmTestViewer.artifactsHost = 'http://prfci100.dev.sabre.com:8040/';
	ptmTestViewer.chartsCount = 0;
	ptmTestViewer.plots = [];
	ptmTestViewer.eLoggingTests = [];
	ptmTestViewer.environments = [];
	ptmTestViewer.initialize = function() {
		$.jqplot.config.enablePlugins = true;
		var parameters = window.location.search.slice(1).split('&');
		var parameters_new = new Object();
		for (var i = 0; i < parameters.length; i++) {
			var param = parameters[i].split('=');
			parameters_new[param[0]] = param[1];
		}

		$
				.ajax('testsList')
				.done(
						function(data) {
							ptmTestViewer.environments = data.sort().reverse();
							addNewChartBox();
							var chartCanvas = $('<div class="spacer"><div id="chart_canvas" class="chartCanvas"></div></div>');
							$('#shadowtailChartsContainer').append(chartCanvas);

							var testId = parameters_new['testId'];
							if (testId
									&& ptmTestViewer.environments
											.indexOf(testId) > -1) {
								testSelectionChange(testId,
										$('#eventsTableWrapper'));
								
							}

						})
	
	};

	ptmTestViewer.populateAvailableTests = function(testsSelect, id) {

		testsSelect.data({
			id : this.chartsCount
		});

		testsSelect.append(createSelectOption('', 'select test ...'));
		var i = 0;
		for (i = 0; i < ptmTestViewer.environments.length; i++) {
			var value = ptmTestViewer.environments[i];
			testsSelect.append(createSelectOption(value, value));
		}
	};

	var addNewChartBox = function() {
		var chartBox = createChartBox();
		var container = $('#shadowtailChartsContainer');
		container.append(chartBox);
		this.chartsCount++;
	};

	var createChartBox = function() {
		var chartBox = $('<div id="chart_box" class="chartBox"></div>');
		var testsSelect = $('<select id="chart_testsSelect" class="chart_testsSelect select"></select>');
		var eventsTableWrapper = $('<div id="eventsTableWrapper" class="spacer"></div>');

		testsSelect.change(function() {
			var selctedTest = $('#chart_testsSelect').val();

			testSelectionChange(selctedTest, $('#eventsTableWrapper'));
		});

		var id = this.chartsCount;
		ptmTestViewer.populateAvailableTests(testsSelect, id);

		var drawButton = $('<button id="chart_drawButton_' + this.chartsCount
				+ ' type="button" class="button">Redraw</button>');
		drawButton.click(function() {
			redrawChart_fromTableSelection(id);
		});

		var clearSelectionButton = $('<button id="chart_clearSelectionButton_'
				+ this.chartsCount
				+ ' type="button" class="button">Clear selection</button>');
		clearSelectionButton.click(function() {
			ptmTestViewer.selectedCharts = undefined;
			$('table tbody tr td.selectedEvent').each(function() {
				$(this).removeClass('selectedEvent');
			})
		});

		var additionalTests = $('<button type="button" class="button">Additional test</button>');
		additionalTests.click(addNewChartBox);

		chartBox.append(testsSelect);
		// chartBox.append(drawButton);
		// chartBox.append(clearSelectionButton);
		// chartBox.append(additionalTests);
		// chartBox.append(additionalTestButton);

		chartBox.append(eventsTableWrapper);
		// chartBox.append(additionalTests);

		return chartBox;
	};

	var createSelectOption = function(value, text) {
		return $('<option value="' + value + '">' + text + '</option>');
	};

	var renderShadowtailCrossDeeplinksAndStats = function(testJSON) {
		var result = $('<div class="spacer" />');
		result.append(renderShadowtailCrossDeeplinks(testJSON));
		result.append(renderShadowtailCrossStats(testJSON));
		return result;
	};

	var renderShadowtailCrossStats = function(testJSON) {

		var result = $('<div class="spacer" />');
		result
				.append($('<div class="small-boxHeader" >Target/Tier JVM Statistics</>'));

		var crossTable = makeArtifactTable();
		result.append(crossTable);

		var header = $('<tr/>');
		crossTable.append(header);

		header.append($('<th>Target</th>'));
		header.append($('<th>Tier</th>'));

		var headers = headersOrder;

		headers.forEach(function(headerName) {
			var link = getMultiLink(headerName, testJSON);
			var type = measurementMap[headerName];
			if (!type) {
				type = "50th";
			}
			header.append($('<th>' + link + ' (' + type + ')</th>'));
		});

		testJSON.shadowtail.forEach(function(shadowtail) {
			var tierRow = $('<tr/>');
			crossTable.append(tierRow);

			tierRow.append($('<td>' + shadowtail.target + '</td>'));
			tierRow.append($('<td>' + shadowtail.tier + '</td>'));

			headers.forEach(function(headerName) {
				var stats = shadowtail.parsedCSV;

				var statistic = $.grep(stats, function(element, index, array) {
					return element.Name == headerName;
				});

				var value = '-'
				var type = measurementMap[headerName];
				if (!type) {
					type = "50th";
				}

				if (statistic.length == 1 && statistic[0][type]) {
					value = statistic[0][type];
				}
				tierRow.append($('<td>' + value + '</td>'));
			})

		});

		return result;
	}

	var getDeeplink = function(shadowtail, headerName) {
		var logShort = shadowtail.log.split('/');
		logShort = logShort[logShort.length - 1];

		return 'deeplink[]=' + shadowtail.target + '-' + shadowtail.tier + ":"
				+ logShort + ':' + headerName + ':' + ptmTestViewer.env;

	}

	var getMultiLink = function(headerName, testJSON) {
		var link = '<a href="/shadowtailCharts?';

		for (var s = 0; s < testJSON.shadowtail.length; s++) {
			var shadowtail = testJSON.shadowtail[s];
			link += getDeeplink(shadowtail, headerName);
			link += '&';
		}

		link += '">' + headerName + '</a>';
		return link;
	}

	var renderShadowtailCrossDeeplinks = function(testJSON) {

		var result = $('<div class="spacer" />');
		result.append($('<div class="small-boxHeader">Target/Tier Charts</>'));

		var subRender = function(headers) {
			var crossTable = makeArtifactTable();

			var header = $('<tr/>');
			crossTable.append(header);

			for (var h = 0; h < headers.length; h++) {
				var headerName = headers[h];
				link = getMultiLink(headerName, testJSON);
				header.append($('<th>' + link + '</th>'));

			}

			return crossTable;
		}

		result.append(subRender(headersOrder));

		var shadowtailCombinations = makeArtifactTable();
		var header = $('<tr/>');

		for (var sc = 0; sc < shadowatilCombinations.length; sc++) {
			var combinationName = shadowatilCombinations[sc].name;
			var combinations = shadowatilCombinations[sc].metrics;

			shadowtailCombinations.append(header);
			var link = '<a href="/shadowtailCharts?';
			for (var c = 0; c < combinations.length; c++) {
				for (var s = 0; s < testJSON.shadowtail.length; s++) {
					var shadowtail = testJSON.shadowtail[s];
					link += getDeeplink(shadowtail, combinations[c]);
					link += '&';
				}
			}
			link += '">' + combinationName + '</a>';

			header.append($('<th>' + link + '</th>'));

		}

		result.append(shadowtailCombinations);
		return result;

	}

	var addClick = function(aLink) {
		aLink.click(function() {
			var href = aLink.attr('href');
			aLink.attr('href', 'javascript:window.open("' + href + '");')
		})
	}

	var headersOrder = new Array();
	headersOrder.push("Process-Cpu-Utilization");
	headersOrder.push("Server-Load");
	headersOrder.push("Heap-Memory-Used");
	headersOrder.push("Throughput");
	headersOrder.push("Throughput-Interval");
	headersOrder.push("Throughput-5sec");
	headersOrder.push("Active-Sessions-Count");
	headersOrder.push("Session-Create-Rate");
	headersOrder.push("Session-Expire-Rate");
	headersOrder.push("Session-AVG-Alive-Time");

	headersOrder.push("Https-Received");
	headersOrder.push("Http-Received");
	headersOrder.push("Https-Sent");
	headersOrder.push("Http-Sent");
	headersOrder.push("Https-Processing-Time");
	headersOrder.push("Http-Processing-Time");
	headersOrder.push("Https-Requests");
	headersOrder.push("Http-Requests");
	headersOrder.push("Https-Errors");
	headersOrder.push("Http-Errors");

	headersOrder.push("JVM-Thread-Count");

	headersOrder.push("https-Threads-Busy");
	headersOrder.push("http-Threads-Busy");
	headersOrder.push("https-Threads-Count");
	headersOrder.push("http-Threads-Count");

	headersOrder.push("Loaded-Class-Count");
	headersOrder.push("Unloaded-Class-Count");
	headersOrder.push("GC-CMS-Count");
	headersOrder.push("GC-CMS-Time");
	headersOrder.push("GC-ParNew-Count");
	headersOrder.push("GC-ParNew-Time");

	var catalinaBytesSentReceivedTypes = [ "Https-Received", "Https-Sent",
			"Http-Received", "Http-Sent" ];
	var shadowatilCombinations = new Array();
	shadowatilCombinations.push({
		name : "Catalina-Thread-Pools",
		metrics : [ "https-Threads-Busy", "https-Threads-Count",
				"http-Threads-Busy", "http-Threads-Count" ]
	});
	shadowatilCombinations.push({
		name : "Catalina-Bytes-Sent-Received",
		metrics : catalinaBytesSentReceivedTypes
	});

	shadowatilCombinations.push({
		name : "Catalina-Requests-Errors",
		metrics : [ "Https-Requests", "Https-Errors", "Http-Requests",
				"Http-Errors" ]
	});

	shadowatilCombinations.push({
		name : "Throughput-Combined",
		metrics : [ "Throughput", "Throughput-5sec", "Throughput-Interval" ]
	});

	var startWithHeaders = new Array();
	startWithHeaders.push("GDS-Pool-NumActive-");
	startWithHeaders.push("DB-Pool-NumActive-");

	var measurementMap = {
		"Loaded-Class-Count" : "MAX",
		"Unloaded-Class-Count" : "MAX",
		"Heap-Memory-Used" : "50th",

		"GC-CMS-Count" : "MAX",
		"GC-CMS-Time" : "MAX",
		"GC-ParNew-Count" : "MAX",
		"GC-ParNew-Time" : "MAX",

		"GC-PS-MarkSweep-Count" : "MAX",
		"GC-PS-MarkSweep-Time" : "MAX",
		"GC-PS-Scavenge-Count" : "MAX",
		"GC-PS-Scavenge-Time" : "MAX",

		"JVM-Thread-Count" : "50th",
		"Server-Load" : "50th",
		"Process-Cpu-Utilization" : "50th",
		"Throughput" : "MIN",
		"Throughput-Interval" : "50th",
		"Throughput-5sec" : "50th",
		"http-Threads-Busy" : "50th",
		"http-Threads-Count" : "50th",
		"Active-Sessions-Count" : "50th",
		"Session-Create-Rate" : "50th",
		"Session-Expire-Rate" : "50th",
		"Session-AVG-Alive-Time" : "50th",
		"https-Threads-Busy" : "50th",
		"https-Threads-Count" : "50th",
		"GC-PS-MarkSweep-Count" : "MAX",
		"GC-PS-MarkSweep-Time" : "MAX",
		"GC-PS-Scavenge-Count" : "MAX",
		"GC-PS-Scavenge-Time" : "MAX",
		"ThreadPool-Cars-Rejected" : "MAX",
		"ThreadPool-Booking-Rejected" : "MAX",
		"ThreadPool-Minibooker-Rejected" : "MAX",
		"ThreadPool-Profiles-Rejected" : "MAX",
		"ThreadPool-LFS-Rejected" : "MAX"
	}

	var getShadowtailDeepLinkURL = function(shadowtailReport, metric) {
		var logShort = shadowtailReport.log.split('/');
		logShort = logShort[logShort.length - 1];

		var shadowtailLink = '/shadowtailCharts/?deeplink[]='
				+ shadowtailReport.target + '-' + shadowtailReport.tier + ':'
				+ logShort + ':' + metric +  ':'+ ptmTestViewer.env;
			return shadowtailLink;
	}

	var getShadowtailDeepLink = function(shadowtailReport, metric, text) {
		var URL = getShadowtailDeepLinkURL(shadowtailReport, metric);

		if (!text) {
			text = metric;
		}
		var shadowtailLink = '<a href="' + URL + '">' + text + '</a>';
		return shadowtailLink;
	}

	var renderShadowtailBarChart = function(data, title, domRoot) {

		data = data.sort(function(a, b) {
			return a.name > b.name
		});

		// var holder = $('<div class="barChart" />');
		var holder = document.createElement("div");
		$(domRoot).append(holder);

		if (data.length > 0) {
			var margin = {
				top : 40,
				right : 40,
				bottom : 40,
				left : 150
			};

			var width = 960 - margin.left - margin.right;
			var height = 250 - margin.top - margin.bottom;

			var x0 = d3.scale.ordinal().rangeRoundBands([ 0, width ], .1);
			var x1 = d3.scale.ordinal();
			var y = d3.scale.linear().range([ height, 0 ]);

			// var color = d3.scale.ordinal().range([ "#98abc5", "#8a89a6",
			// "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00" ]);
			var color = d3.scale.ordinal().range(
					[ "#ff8c00", "#98abc5", "#6b486b", "#a05d56" ]);

			var tip = d3.tip().attr('class', 'd3-tip').offset([ -10, 0 ]).html(
					function(d) {
						return "<strong>" + d.metricName
								+ "</strong> <span style='color:red'>"
								+ d.value + "</span>";
					})

			var svg = d3.select(holder).append('svg');
			svg.attr("width", width + margin.left + margin.right);
			svg.attr("height", height + margin.top + margin.bottom);
			svg.append("g").attr("transform",
					"translate(" + margin.left + "," + margin.top + ")");

			svg.call(tip);

			x0.domain(data.map(function(d) {
				return d.name;
			}));

			var x1Domain = data[0].values.map(function(d) {
				return d.metricName;
			})

			x1.domain(x1Domain).rangeRoundBands([ 0, x0.rangeBand() ]);
			var yMax = d3.max(data, function(d) {
				return d3.max(d.values, function(x) {
					return Number(x.value);
				})
			});

			y.domain([ 0, yMax ]);

			var xAxis = d3.svg.axis().scale(x0).orient("bottom");
			svg.append("g").attr("class", "x axis").attr("transform",
					"translate(0," + height + ")").call(xAxis);

			var yAxis = d3.svg.axis().scale(y).orient("right");
			// .tickFormat(d3.format(".0%"));.attr("transform", "rotate(-90)")
			svg.append("g").attr("class", "y axis").call(yAxis);

			var state = svg.selectAll(".state").data(data).enter().append("g")
					.attr("class", "g");
			state.attr("transform", function(d) {
				return "translate(" + x0(d.name) + ",0)";
			});

			var rect = state.selectAll("rect");

			rect.data(function(d) {
				return d.values;
			}).enter().append("rect").attr("width", x1.rangeBand()).attr("x",
					function(d) {
						return x1(d.metricName);
					}).attr("y", function(d) {
				return y(d.value);
			}).attr("height", function(d) {
				return height - y(d.value);
			}).style("fill", function(d) {
				return color(d.metricName);
			}).on('mouseover', tip.show).on('mouseout', tip.hide).on(
					"click",
					function(d) {
						var parent = d3.select(this.parentNode);
						var stat = parent.data()[0].stat;
						var report = parent.data()[0].shadowtailReport;
						window
								.open(getShadowtailDeepLinkURL(report,
										stat.Name));

					});

			var legend = svg.selectAll(".legend").data(
					x1Domain.slice().reverse()).enter().append("g").attr(
					"class", "legend").attr("transform", function(d, i) {
				return "translate(0," + i * 20 + ")";
			});

			legend.append("rect").attr("x", width - 18).attr("width", 18).attr(
					"height", 18).style("fill", color);
			legend.append("text").attr("x", width - 24).attr("y", 9).attr("dy",
					".35em").style("text-anchor", "end").text(function(d) {
				return d;
			});

			// title
			svg.append("text").attr("x", (width / 2)).attr("y",
					height + margin.bottom).attr("text-anchor", "middle")
					.style("font-size", "16px").style("text-decoration",
							"underline").text(title);

		}
		return holder;

	};

	var getShadowtailStatsTable = function(shadowtailReport, domRoot) {

		var headers = shadowtailReport.reportCSV.split("\n")[0].split(",");
		var stats = shadowtailReport.parsedCSV;

		var statsHolder = $('<div/>')
		var displayedHeaders = new Array();
		var statsTable = makeArtifactTable();
		statsHolder.append(statsTable);

		var header = $('<tr/>');
		var row = $('<tr/>');

		statsTable.append(header);
		statsTable.append(row);

		var count = 0;
		for (var i = 0; i < headersOrder.length; i++) {

			for (var s = 0; s < stats.length; s++) {
				if (stats[s].Name == headersOrder[i]) {
					displayedHeaders.push(stats[s].Name);
					count++;

					var type = measurementMap[stats[s].Name];
					if (!type) {
						type = "50th";
					}
					var value = stats[s][type];
					var name = stats[s].Name;
					if ("Heap-Memory-Used" == name) {
						value = value / 1024 / 1024;
						value = value.toFixed(0);
					} else if (catalinaBytesSentReceivedTypes.indexOf(name) >= 0) {
						value = value / 1024;
						value = value.toFixed(0);
					}

					row.append($('<td>' + value + '</td>'));
					var shadowtaiDeeplLink = getShadowtailDeepLink(
							shadowtailReport, headersOrder[i]);
					header.append($('<th>' + shadowtaiDeeplLink + ' (' + type
							+ ')</th>'));

					if (count >= 10) {
						count = 0;
						statsTable = makeArtifactTable();
						statsHolder.append(statsTable);
						header = $('<tr/>');
						row = $('<tr/>');
						statsTable.append(header);
						statsTable.append(row);
					}
				}
			}

		}

		startWithHeaders.forEach(function(startWithHeader) {

			statsTable = makeArtifactTable();

			var headRow = $('<tr/>');
			var tr = $('<tr/>');
			statsTable.append(headRow);
			statsTable.append(tr);
			headRow.append('<th></th>');

			var link = '<a href="/shadowtailCharts?';
			var deeplinkTd = $('<td/>');
			tr.append(deeplinkTd);
			var found = false;

			var allHeaders = [];
			var allHeadersValueMap = [];
			for (var s = 0; s < stats.length; s++) {
				var stat = stats[s];
				var statName = stat.Name;

				if (displayedHeaders.indexOf(statName) == -1
						&& statName.indexOf(startWithHeader) == 0) {
					displayedHeaders.push(statName);
					found = true;

					var header = statName.replace(startWithHeader, '');
					allHeaders.push(statName);

					var type = measurementMap[statName];
					if (!type) {
						type = "AVG";
					}

					// allHeadersValueMap.push([stat["AVG"],stat["50th"],stat["90th"],stat["95ht"]]);

					var value = stats[s][type];
					var deepLink = getShadowtailDeepLink(shadowtailReport,
							statName, header);
					// headRow.append('<th>' + deepLink + '</th>');
					// tr.append('<td>' + value + '</td>');

					var logShort = shadowtailReport.log.split('/');
					logShort = logShort[logShort.length - 1];

					// link += '&deeplink[]=' + shadowtailReport.target + '-' +
					// shadowtailReport.tier + ":" + logShort + ':' + statName;

				}

			}

			allHeaders = allHeaders.sort();

			allHeaders.forEach(function(headName) {
				var stat = stats.filter(function(x) {
					return x.Name == headName;
				})[0];

				var statName = stat.Name;
				var header = statName.replace(startWithHeader, '');
				var type = measurementMap[statName];
				if (!type) {
					type = "AVG";
				}
				var value = stat[type];
				var deepLink = getShadowtailDeepLink(shadowtailReport,
						statName, header);
				headRow.append('<th>' + deepLink + '</th>');
				tr.append('<td>' + value + '</td>');

				var logShort = shadowtailReport.log.split('/');
				logShort = logShort[logShort.length - 1];

				link += '&deeplink[]=' + shadowtailReport.target + '-'
						+ shadowtailReport.tier + ":" + logShort + ':'
						+ statName;

			});

			var metrics = [ "AVG", "50th", "90th" ];

			var objects = allHeaders.map(function(headName) {

				var stat = stats.filter(function(x) {
					return x.Name == headName;
				})[0];

				var values = metrics.map(function(x) {
					return {
						metricName : x,
						value : stat[x]
					}
				})
				var object = {
					name : headName.replace(startWithHeader, ''),
					stat : stat,
					values : values,
					shadowtailReport : shadowtailReport
				}
				return object;
			});

			var barChartDiv = renderShadowtailBarChart(objects,
					startWithHeader, domRoot);

			link += '">' + startWithHeader + '</a>';
			addClick($(link))
			deeplinkTd.append(link);

			if (found) {
				statsHolder.append(statsTable);
				statsHolder.append(barChartDiv);
			}
		})

		statsTable = makeArtifactTable();
		statsHolder.append(statsTable);

		var headRow = $('<tr/>');
		var tr = $('<tr/>');
		statsTable.append(headRow);
		statsTable.append(tr);

		var tdCount = 0;

		// add table with non standard values
		for (var s = 0; s < stats.length; s++) {
			if (displayedHeaders.indexOf(stats[s].Name) == -1) {
				var type = measurementMap[stats[s].Name];
				if (!type) {
					type = "50th";
				}
				var shadowtaiDeeplLink = getShadowtailDeepLink(
						shadowtailReport, stats[s].Name);

				headRow.append($('<th>' + shadowtaiDeeplLink + ' (' + type
						+ ')</th>'));

				val = stats[s][type];
				tr.append($('<td>' + val + '</td>'));

				if (tdCount > 7) {
					statsTable = makeArtifactTable();
					statsHolder.append(statsTable);
					headRow = $('<tr/>');
					tr = $('<tr/>');
					statsTable.append(headRow);
					statsTable.append(tr);
					tdCount = 0;
				}

			}
		}

		return statsHolder;
	};

	var makeArtifactTable = function() {
		return $('<table cellpadding="5px" border="1" class="artifactTable"></table>');
	};

	var createNewCanvas = function() {
		var canvas = $('#chart_canvas');
		var newCanvas = $('<div id="chart_canvas" class="chartCanvas"></div>');
		canvas.replaceWith(newCanvas);

	};

	var prepareStatisticsForTableRendering = function(selctedTestId) {

		var selectedTest = ptmTestViewer.tests[selctedTestId];
		var config = selectedTest.config;
		var aggregationTypes = config.aggregationTypes;
		var types = selectedTest.eventTypes;

		var tableDataSet = [];
		for ( var idx in types) {
			var type = types[idx];
			var names = ptmTestViewer.tests[selctedTestId]['type'][type].eventNames;
			var j = 0;
			for (j = 0; j < names.length; j++) {

				var eventData = ptmTestViewer.tests[selctedTestId]['type'][type][names[j]];
				var statistics = eventData.statistics;
				var errorRate = 0;
				if (statistics.CNT == 0) {
					errorRate = 100.00;
				} else {
					errorRate = (statistics.ERR / statistics.CNT * 100)
							.toFixed(2);
				}
				var eventDataForTable = [ type, names[j] ];
				for ( var aIdx in aggregationTypes) {
					eventDataForTable.push(statistics[aggregationTypes[aIdx]]);
				}
				eventDataForTable.push(errorRate);
				tableDataSet.push(eventDataForTable);
			}
		}
		return tableDataSet;

	};

	var parseProperties = function(data) {
		var testConfig = {};
		var lines = data.split('\n');
		for (var i = 0; i < lines.length; i++) {
			var line = lines[i];
			var lineSplit = line.split('=');
			var name = lineSplit[0];
			var value = '';
			if (lineSplit.length == 2) {
				value = lineSplit[1];
			} else {

				for (var j = 1; j < lineSplit.length; j++) {
					value += lineSplit[j];
					if (j < lineSplit.length - 1) {
						value += '=';
					}
				}
				;

			}

			testConfig[name] = value;
		}
		return testConfig;
	};

	var getGcLogs = function(testJSON) {

		testJSON.gcLogs = new Array();

		for (var targetIdx = 0; targetIdx < testJSON.targetsList.length; targetIdx++) {
			var targetName = testJSON.targetsList[targetIdx];
			var targetJSON = testJSON.targets[targetName];
			var targetPropetries = targetJSON.targetPropetries;
			var testProperties = testJSON.testPropeties;
			var product = targetJSON.product;
			targetJSON.gcLogs = new Array();

			for (var t = 0; t < targetJSON.tiers.length; t++) {
				var tier = targetJSON.tiers[t];
				var backup = testProperties[targetName + '.' + tier
						+ '.gcLog.backup'];
				var report = testProperties[targetName + '.' + tier
						+ '.gcLog.report'];
				var gcLog = new Object();
				// {
				// target : targetName,
				// tier : tier,
				// gcLogBackup : backup,
				// gcLogReport : report
				// }

				gcLog.target = targetName;
				gcLog.tier = tier;
				gcLog.gcLogBackup = backup;
				gcLog.gcLogReport = report;
				gcLog.product = product;
				targetJSON.gcLogs.push(gcLog);
				testJSON.gcLogs.push(gcLog);

			}
		}

	};


	var getAWR = function(testJSON) {

		testJSON.awrs = new Array();

		for (var targetIdx = 0; targetIdx < testJSON.targetsList.length; targetIdx++) {
			var targetName = testJSON.targetsList[targetIdx];
			var targetJSON = testJSON.targets[targetName];
			var targetPropetries = targetJSON.targetPropetries;
			var testProperties = testJSON.testPropeties;

			var AWR = {
				target : targetName,
				awr : targetPropetries[targetName + '.db.awr']
			};
			testJSON.awrs.push(AWR);

		}

	};

	var getThreadDumps = function(testJSON) {

		testJSON.threadDumps = new Array();

		for (var targetIdx = 0; targetIdx < testJSON.targetsList.length; targetIdx++) {
			var targetName = testJSON.targetsList[targetIdx];
			var targetJSON = testJSON.targets[targetName];
			var targetPropetries = targetJSON.targetPropetries;
			var testProperties = testJSON.testPropeties;

			targetJSON.threadDumps = new Array();

			for (var t = 0; t < targetJSON.tiers.length; t++) {
				var tier = targetJSON.tiers[t];

				var td = testProperties[targetName + '.' + tier
						+ '.threadDumps'];
				td = {
					target : targetName,
					tier : tier,
					threadDumps : td,
				};

				targetJSON.threadDumps.push(td);
				testJSON.threadDumps.push(td);
			}
		}

	};


	var getShadowtail = function(testJSON) {

		testJSON.shadowtail = new Array();

		for (var targetIdx = 0; targetIdx < testJSON.targetsList.length; targetIdx++) {
			var targetName = testJSON.targetsList[targetIdx];
			var targetJSON = testJSON.targets[targetName];
			var targetPropetries = targetJSON.targetPropetries;
			var testProperties = testJSON.testPropeties;

			targetJSON.shadowtail = new Array();

			var target = targetName;
			var tiers = targetJSON.tiers;
			var product = targetJSON.product;
			for (var t = 0; t < targetJSON.tiers.length; t++) {
				var tier = targetJSON.tiers[t];

				var log = testProperties[target + '.' + tier
						+ '.shadowtail.log'];
				var report = testProperties[target + '.' + tier
						+ '.shadowtail.report'];

				var shad = new Object();
				shad.target = target;
				shad.tier = tier;
				shad.log = log;
				shad.report = report;
				shad.product = product;

				targetJSON.shadowtail.push(shad);
				testJSON.shadowtail.push(shad);

			}

		}
		return testJSON.shadowtail
	};

	var getELoggingCharts = function(testJSON) {

		testJSON.eLoggingCharts = new Array();

		for (var targetIdx = 0; targetIdx < testJSON.targetsList.length; targetIdx++) {
			var targetName = testJSON.targetsList[targetIdx];
			var targetJSON = testJSON.targets[targetName];
			var targetPropetries = targetJSON.targetPropetries;
			var testProperties = testJSON.testPropeties;

			targetJSON.eLoggingCharts = new Array();

			var target = targetName;
			var tiers = targetJSON.tiers;
			//Sandy
			var product = targetJSON.product;
			for (var t = 0; t < tiers.length; t++) {
				var tier = tiers[t];
				var apps = targetPropetries[tier + '.apps'].split(";");
				for (a = 0; a < apps.length; a++) {
					var app = apps[a];
					var eLogChartLocation = testProperties[target + '.' + tier
							+ '.' + app + '.eLoggingCharts'];
					if (eLogChartLocation) {
						var eLogChart = {
							target : target,
							tier : tier,
							app : app,
							product : product,
							chartData : eLogChartLocation
						};
						targetJSON.eLoggingCharts.push(eLogChart);
						testJSON.eLoggingCharts.push(eLogChart);

					}

				}

			}

		}

		return testJSON.eLoggingCharts;

	};

	var createSpinner = function() {
		var spin = $('<div/>');
		var opts = {
			lines : 13, // The number of lines to draw
			length : 8, // The length of each line
			width : 2, // The line thickness
			radius : 0, // The radius of the inner circle
			corners : 1, // Corner roundness (0..1)
			rotate : 34, // The rotation offset
			direction : 1, // 1: clockwise, -1: counterclockwise
			color : 'black', // #rgb or #rrggbb or array of colors
			speed : 0.7, // Rounds per second
			trail : 47, // Afterglow percentage
			shadow : false, // Whether to render a shadow
			hwaccel : false, // Whether to use hardware acceleration
			className : 'spinner', // The CSS class to assign to the
			// spinner
			zIndex : 2e9, // The z-index (defaults to 2000000000)
			top : 'auto', // Top position relative to parent in px
			left : 'auto' // Left position relative to parent in px
		};

		spin.spin(opts);
		return spin;
	};

	var renderEloggingCharts = function(testJSON, DOMHook) {
		var eCharts = $('<div class="spacer"/>');
		eCharts.append($('<div class="medium-boxHeader">eLoggingCharts</div>'));
		var echartsTable = $('<table cellpadding="5px" border="1" class="artifactTable"></table>');
		echartsTable
				.append($('<tr><th>target</th><th>tier</th><th>app</th><th>Statistics</th><th>Errors</th><th>Validation</th></tr>'));

		eCharts.append(echartsTable);
		for (var g = 0; g < testJSON.eLoggingCharts.length; g++) {
			var chart = testJSON.eLoggingCharts[g];

			var tr = $('<tr/>');

			var chartData = chart.chartData;

			tr.append($('<td>' + chart.target + '</td>'));
			tr.append($('<td>' + chart.tier + '</td>'));
//Sandy
			var deeplink = '/eLoggingCharts/' + chart.product + '/?deeplink[]=/' + chartData;
			tr.append($('<td><a href="' + deeplink + '" > ' + chart.app
					+ '</a></td>'));

			var data = "/" + chartData + "/";
			tr.append($('<td><a href="' + data
					+ '/statistics.csv">statistics.csv</a></td>'));
			tr.append($('<td><a href="' + data
					+ '/errors.csv">errors.csv</a></td>'));
			tr.append($('<td><a href="' + data
					+ '/validation.csv">validation.csv</a></td>'));

			$.ajax({
				type : "GET",
				url : data + '/statistics.csv',
				context : {
					chart : chart,
					DOMHook : DOMHook
				}
			}).done(function(statistics) {
				console.log('got statistics.csv ' + this.chart.app);

				var csv = $.csv.toObjects(statistics);
				this.statisticsCsvData = csv;

			}).fail(function(x) {
				console.log('failed to get statistics.csv ' + this.chart.app);

			});
			echartsTable.append(tr);
		}

		return eCharts;
	};

	var renderAWR = function(testJSON) {

		var awrDiv = $('<div class="spacer "/>');
		if (testJSON.awr.length > 0) {
			awrDiv.append($('<div class="medium-boxHeader">AWRs</div>'));
			for (var g = 0; g < testJSON.awr.length; g++) {
				awrDiv.append($('<div class="spacer "/>'));
				awr = testJSON.awr[g];
				awrDiv.append($('<a href="/' + awr.awrReport + '">'
						+ awr.awrReport + '</a>'));
				awrDiv.append($('<div class="spacer "/>'));
				awrDiv.append($('<iframe height="800px" width="100%" src="/'
						+ awr.awrReport + '"/>'));
			}
		}
		return awrDiv;
	};

	var renderThreadDumps = function(testJSON) {
		var threadDumps = $('<div class="spacer "/>');
		threadDumps
				.append($('<div class="medium-boxHeader">Thread Dumps</div>'));
		var tdTable = $('<table cellpadding="5px" border="1" class="artifactTable"></table>');
		tdTable
				.append($('<tr><th>Target</th><th>Tier</th><th>Thread dumps</th><th>Blocked</th></tr>'));
		threadDumps.append(tdTable);
		for (var g = 0; g < testJSON.threadDumps.length; g++) {
			td = testJSON.threadDumps[g];
			var tdTR = $('<tr/>');

			tdTR.append($('<td>' + td.target + '</td>'));
			tdTR.append($('<td>' + td.tier + '</td>'));
			tdTR.append($('<td><a href="/' + td.threadDumps
					+ '">thread Dumps</a></td>'));

			var spinner = createSpinner();
			tdTR.append(spinner);
			td.spinner = spinner;

			$
					.ajax({
						type : "GET",
						url : '/' + td.threadDumps + '/blocked.txt',
						context : td
					})
					.done(
							function(data) {
								console.log('got blocked report');

								if (this.spinner) {
									this.spinner.stop();

									var blockTable = $('<table cellpadding="5px" border="1" class="artifactTable"></table>');
									blockTable
											.append($('<tr><th>Blocked Count</th><th>Thread dump</th></tr>'));
									var data = data.split('\n');
									for (var i = 0; i < data.length; i++) {
										var line = data[i].split(":");
										if (line.length > 1) {
											var tr = $('<tr/>');
											tr.append('<td>' + line[1]
													+ '</td>');
											var tdLink = "/" + this.threadDumps
													+ "/" + line[0];
											tr.append('<td><a href="' + tdLink
													+ '">' + line[0] + '</td>');
											blockTable.append(tr);
										}
									}

									this.spinner.replaceWith(blockTable);
									this.spinner = undefined;
								} else {
									console.log('spinner not set');
								}
							})
					.fail(
							function(x) {
								console.log('failed to get blocked report');
								if (this.spinner) {
									this.spinner.stop();
									this.spinner
											.replaceWith($('<td>blocked.txt not found</td>'));
									this.spinner = undefined;
								} else {
									console.log('spinner not set');
								}
							});
			;

			tdTable.append(tdTR);

		}

		return threadDumps;
	};

	var renderShadowtail = function(testJSON) {
		var shadowtail = $('<div class="spacer shadowtailBox"/>');
		shadowtail.append($('<div class="medium-boxHeader">Shadowtail</div>'));

		shadowtail.append($('<div class="spacer shadowail-cross-charts"/>'));

		shadowtail
				.append($('<div class="small-boxHeader">Target/Tier statistics</>'));

		var shadowtailTable = $('<table id="shadowtailTable-'
				+ testJSON.testId
				+ '" cellpadding="5px" border="1" class="shadowtailTable artifactTable"></table>');
		shadowtail.append(shadowtailTable);
		shadowtailTable
				.append($('<tr><th>target</th><th>tier</th><th>log</th><th>report</th><th>Statistics</th></tr>'));

		var allJSONSPromises = new Array();
		
		for (var g = 0; g < testJSON.shadowtail.length; g++) {
			var shad = testJSON.shadowtail[g];
			var tr = $('<tr/>');
			var log = "/" + shad.log;
			tr.append($('<td>' + shad.target + '</td>'));
			tr.append($('<td><a href="/artifacts/' + shad.product + '/' + 'shadowtail/'
					+ shad.target + '-' + shad.tier + '/report.csv" >'
					+ shad.tier + '</a></td>'));
			tr.append($('<td><a href="' + log + '">log</a></td>'));
			tr.append($('<td><a href="/' + shad.report + '">report</a></td>'));

			var toClick = $('<td></td>');

			var spinner = createSpinner();
			toClick.append(spinner);
			shad.spinner = spinner;

			tr.append(toClick);
			shadowtailTable.append(tr);

			var promise = $.ajax({
				type : "GET",
				url : '/' + shad.report,
				context : shad
			});
			allJSONSPromises.push(promise);
			promise.done(function(data) {
				console.log('got shadowtail report ' + this.log);
				this.reportCSV = data;
				this.parsedCSV = $.csv.toObjects(this.reportCSV, {
					separator : ","
				});

				this.parsedCSV.getMeasurement = function(name) {

				}

				if (this.spinner) {
					this.spinner.stop();
					$(this.spinner).replaceWith(
							getShadowtailStatsTable(this, $('body')));
					this.spinner = undefined;
				}
			});

		}

		$.when.apply($, allJSONSPromises).then(function() {
			var crossTable = renderShadowtailCrossDeeplinksAndStats(testJSON);
			$($('.shadowail-cross-charts')[0]).prepend(crossTable);
		})

		return shadowtail;
	};

	var renderArtifacts = function(eventsTableWrapper, testJSON) {

		eventsTableWrapper.find('*').remove();
		var summary = $('<div id="summary" class="spacer"/>');

		var tableSummary = $('<table cellpadding="5px" border="1" class="artifactTable"></table>');
		tableSummary.append($('<tr><td>Test Tag:</td> <td>' + testJSON.testTag
				+ '</td></tr>'));
		tableSummary.append($('<tr><td>Test Id:</td> <td>' + testJSON.testId
				+ '</td></tr>'));
		tableSummary.append($('<tr><td>Test start:</td> <td>'
				+ testJSON.testStart + '</td></tr>'));
		if (testJSON.testStop) {
			tableSummary.append($('<tr><td>Test stop:</td> <td> '
					+ testJSON.testStop + '</td></tr>'));
		} else {
			tableSummary.append($('<tr><td>Test cancel:</td> <td> '
					+ testJSON.testCancel + '</td></tr>'));
		}

		var deeplink = this.location.protocol + '//' + this.location.host
				+ this.location.pathname + '?testId=' + testJSON.testId;
		tableSummary.append($('<tr><td>Deeplink:</td> <td><a href="' + deeplink
				+ '">' + testJSON.testId + '</a></td></tr>'));

		summary.append(tableSummary);

		eventsTableWrapper.append($('<div class="boxHeader">Summary</div>'));

		eventsTableWrapper.append(summary);

		var artifacts = $('<div id="artifacts" class="spacer"/>');
		artifacts.append($('<div class="boxHeader">Artifacts</div>'));

		var shadowtail = renderShadowtail(testJSON);
		artifacts.append(shadowtail);

		var gcLogsRender = renderGcLogs(testJSON);
		artifacts.append(gcLogsRender);

		var eCharts = renderEloggingCharts(testJSON, artifacts);
		artifacts.append(eCharts);

		var threadDumps = renderThreadDumps(testJSON);
		artifacts.append(threadDumps);

		var awr = renderAWR(testJSON);
		artifacts.append(awr);

		eventsTableWrapper.append(artifacts);

	};

	var renderGcLogs = function(testJSON) {
		var gcLogs = $('<div class="spacer "/>');
		gcLogs.append($('<div class="medium-boxHeader">gcLogs</div>'));

		gcLogs.append($('<div class="spacer gcLogs-cross-charts"/>'));

		var gcLogsTable = $('<table cellpadding="5px" border="1" class="artifactTable" />');
		gcLogsTable
				.append($('<tr><th>Target</th><th>Tier</th><th>gc.log</th><th>gc report</th><th>statistics</th></tr>'));
		gcLogs.append(gcLogsTable);

		var promises = [];
		for (var g = 0; g < testJSON.gcLogs.length; g++) {

			var gcTabEntry = $('<tr/>');
			var gcLog = testJSON.gcLogs[g];

			gcTabEntry.append($('<td>' + gcLog.target + '</td>'));
			gcTabEntry.append($('<td><a href="/artifacts/' + gcLog.product + '/'+ 'gcLogs/'
					+ gcLog.target + '-' + gcLog.tier + '/report.csv" >'
					+ gcLog.tier + '</a></td>'));
			gcTabEntry.append($('<td><a href="/' + gcLog.gcLogBackup
					+ '">gc.log</a>' + '</td>'));
			gcTabEntry.append($('<td>' + '<a href="/' + gcLog.gcLogReport
					+ '">GC Report</a>' + '</td>'));
			var statsCol = $('<td/>');
			gcTabEntry.append(statsCol);

			var spinner = createSpinner();
			statsCol.append(spinner);
			gcLog.spinner = spinner;

			gcLogsTable.append(gcTabEntry);
			var promise = $.ajax({
				type : "GET",
				url : '/' + gcLog.gcLogReport,
				context : gcLog
			}).done(function(data) {
				console.log('got gc.log report');
				this.report = parseGCReport(data);
				this.reportTxt = data;

				if (this.spinner) {
					this.spinner.stop();
					this.spinner.replaceWith(renderGCReport(this.report));
					this.spinner = undefined;
				} else {
					console.log('spinner not set');
				}
			});

			promises.push(promise);

		}

		$.when.apply($, promises).then(function() {
			var crossTable = renderGCCrossStats(testJSON);
			$($('.gcLogs-cross-charts')[0]).prepend(crossTable);
		})

		return gcLogs;
	};

	var renderGCCrossStats = function(testJSON) {

		var result = $('<div class="spacer" />');
		result
				.append($('<div class="small-boxHeader" >Target/Tier GC Statistics</>'));

		var crossTable = makeArtifactTable();
		result.append(crossTable);

		var header = $('<tr/>');
		crossTable.append(header);

		header.append($('<th>Target</th>'));
		header.append($('<th>Tier</th>'));

		var headers = gcHeaderOrder;

		headers.forEach(function(headerName) {
			header.append($('<th>' + headerName + '</th>'));
		});

		testJSON.gcLogs.forEach(function(gcLog) {
			var tierRow = $('<tr/>');
			crossTable.append(tierRow);

			tierRow.append($('<td>' + gcLog.target + '</td>'));
			tierRow.append($('<td>' + gcLog.tier + '</td>'));

			headers.forEach(function(headerName) {
				var stats = gcLog.report;
				var value = stats[headerName];
				tierRow.append($('<td>' + value + '</td>'));
			})

		});

		return result;
	}

	var gcEventTypes = ptmTestViewer.gcEventTypes = new Array();

	gcEventTypes.push("Scavenge-Before-Remark");
	gcEventTypes.push("DefNew:");
	gcEventTypes.push("ParNew:");
	gcEventTypes.push("GC");
	gcEventTypes.push("Full GC");

	gcEventTypes.push("Full GC (System) CMS: CMS Perm :");

	gcEventTypes.push("ASParNew:");
	gcEventTypes.push("ParOldGen:");
	gcEventTypes.push("PSYoungGen:");
	gcEventTypes.push("PSOldGen:");
	gcEventTypes.push("PSPermGen:");
	gcEventTypes.push("Tenured:");
	gcEventTypes.push("Train:");
	gcEventTypes.push("Train MSC:");
	gcEventTypes.push("Perm:");
	gcEventTypes.push("CMS:");
	gcEventTypes.push("CMS Perm :");
	gcEventTypes.push("ParNew (promotion failed):");
	gcEventTypes.push("CMS (concurrent mode failure):");
	gcEventTypes.push("CMS (concurrent mode interrupted):");
	gcEventTypes.push("CMS-concurrent-mark-start");
	gcEventTypes.push("CMS-concurrent-mark:");
	gcEventTypes.push("CMS-concurrent-preclean-start");
	gcEventTypes.push("CMS-concurrent-preclean");
	gcEventTypes.push("CMS-concurrent-sweep-start");
	gcEventTypes.push("CMS-concurrent-sweep:");
	gcEventTypes.push("CMS-concurrent-reset-start");
	gcEventTypes.push("CMS-concurrent-reset:");
	gcEventTypes.push("CMS-concurrent-abortable-preclean-start");
	gcEventTypes.push("CMS-concurrent-abortable-preclean:");
	gcEventTypes.push("CMS-initial-mark:");
	gcEventTypes.push("CMS-remark:");
	gcEventTypes.push("ASCMS:");
	gcEventTypes.push("ASParNew (promotion failed):");
	gcEventTypes.push("ASCMS (concurrent mode failure):");
	gcEventTypes.push("ASCMS (concurrent mode interrupted):");
	gcEventTypes.push("ASCMS-concurrent-mark-start");
	gcEventTypes.push("ASCMS-concurrent-mark:");
	gcEventTypes.push("ASCMS-concurrent-preclean-start");
	gcEventTypes.push("ASCMS-concurrent-preclean");
	gcEventTypes.push("ASCMS-concurrent-sweep-start");
	gcEventTypes.push("ASCMS-concurrent-sweep:");
	gcEventTypes.push("ASCMS-concurrent-reset-start");
	gcEventTypes.push("ASCMS-concurrent-reset:");
	gcEventTypes.push("ASCMS-concurrent-abortable-preclean-start");
	gcEventTypes.push("ASCMS-concurrent-abortable-preclean:");
	gcEventTypes.push("ASCMS-initial-mark:");
	gcEventTypes.push("ASCMS-remark:");
	gcEventTypes.push("Full GC (System.gc())");
	gcEventTypes.push("GC pause (young)");
	gcEventTypes.push("GC pause (young) Mark stack is full");
	gcEventTypes.push("GC pause (young)--");
	gcEventTypes.push("GC pause (young) (to-space overflow)");
	gcEventTypes.push("GC pause (partial)");
	gcEventTypes.push("GC pause (partial) (to-space overflow)");
	gcEventTypes.push("GC pause (mixed)");
	gcEventTypes.push("GC pause (mixed) (to-space overflow)");
	gcEventTypes.push("GC pause (young) (initial-mark)");
	gcEventTypes.push("GC pause (young) (to-space overflow) (initial-mark)");
	gcEventTypes.push("GC pause (partial) (initial-mark)");
	gcEventTypes.push("GC pause (partial) (to-space overflow) (initial-mark)");
	gcEventTypes.push("GC remark");
	gcEventTypes.push("GC ref-proc");
	gcEventTypes.push("GC cleanup");
	gcEventTypes.push("Eden:");
	gcEventTypes.push("GC concurrent-root-region-scan-start");
	gcEventTypes.push("GC concurrent-root-region-scan-end");
	gcEventTypes.push("GC concurrent-mark-start");
	gcEventTypes.push("GC concurrent-mark-end,");
	gcEventTypes.push("GC concurrent-mark-abort");
	gcEventTypes.push("GC concurrent-mark-reset-for-overflow");
	gcEventTypes.push("GC concurrent-count-start");
	gcEventTypes.push("GC concurrent-count-end,");
	gcEventTypes.push("GC concurrent-cleanup-start");
	gcEventTypes.push("GC concurrent-cleanup-end,");

	var memoryStatsTypes = ptmTestViewer.memoryStatsTypes = new Array();
	memoryStatsTypes.push("heap size used");
	memoryStatsTypes.push("perm size used");
	memoryStatsTypes.push("tenured size used");
	memoryStatsTypes.push("young size used");

	var gcHeaderOrder = new Array();
	gcHeaderOrder.push("avgfootprintAfterGC");
	gcHeaderOrder.push("throughput");
	gcHeaderOrder.push("freedMemoryPerMin");

	gcHeaderOrder.push("avgPauseInterval");
	gcHeaderOrder.push("avgPause");
	gcHeaderOrder.push("maxPause");

	gcHeaderOrder.push("avgPromotion");
	gcHeaderOrder.push("avgFreedMemoryByGC");

	gcHeaderOrder.push("avgFullGCPause");

	gcHeaderOrder.push("fullGCPause");
	gcHeaderOrder.push("fullGCPauseCount");
	gcHeaderOrder.push("fullGCPausePc");

	gcHeaderOrder.push("avgGCPause");
	gcHeaderOrder.push("gcPause");
	gcHeaderOrder.push("gcPausePc");

	gcHeaderOrder.push("accumPause");
	gcHeaderOrder.push("footprint");
	gcHeaderOrder.push("totalTime");
	gcHeaderOrder.push("dateTimeBegin");
	gcHeaderOrder.push("dateTimeEnd");

	var renderGCReport = function(gcReport) {
		var gcDiv = $('<div/>');

		var gcSummaryTable = $('<table cellpadding="5px" border="1" class="artifactTable" />');
		var header = $('<tr/>')
		var row = $('<tr/>')
		gcSummaryTable.append(header);
		gcSummaryTable.append(row);

		var count = 0;
		for (var i = 0; i < gcHeaderOrder.length; i++ & count++) {
			header.append($('<th>' + gcHeaderOrder[i] + '</th>'));
			row.append($('<td>' + gcReport[gcHeaderOrder[i]] + '</td>'));
			if (count >= 10) {
				count = 0;
				gcDiv.append(gcSummaryTable);
				gcSummaryTable = $('<table cellpadding="5px" border="1" class="artifactTable" />');
				header = $('<tr/>')
				row = $('<tr/>')
				gcSummaryTable.append(header);
				gcSummaryTable.append(row);

			}
		}

		gcDiv.append(gcSummaryTable);

		var gcTypeTable = $('<table cellpadding="5px" border="1" class="artifactTable" />');
		var header = $('<tr><th>GC Type</th><th>N</th><th>Avg</th><th>Sum</th><th>Min</th><th>Max</th></tr>')
		gcTypeTable.append(header);

		for (var i = 0; i < gcReport.gcEvents.length; i++) {

			var tr = new $('<tr/>');
			var event = gcReport.gcEvents[i];

			var value = event.values.split("/");
			tr.append($('<td>' + event.name + '</td>'));
			tr.append($('<td>' + value[0] + '</td>'));
			tr.append($('<td>' + value[1] + '</td>'));
			tr.append($('<td>' + value[2] + '</td>'));
			tr.append($('<td>' + value[3] + '</td>'));
			tr.append($('<td>' + value[4] + '</td>'));
			gcTypeTable.append(tr);

		}
		gcDiv.append(gcTypeTable);

		var memoryTable = $('<table cellpadding="5px" border="1" class="artifactTable" />');
		var header = $('<tr><th>Memory</th><th>N</th><th>Avg</th><th>Std Dev</th><th>Min</th><th>Max</th></tr>')
		memoryTable.append(header);

		var formatMemory = function(memoryInBytes) {
			return (memoryInBytes / 1024.0).toFixed(0);
		}
		for (var i = 0; i < gcReport.memoryStats.length; i++) {

			var tr = new $('<tr/>');
			var stat = gcReport.memoryStats[i];

			var value = stat.values.split("/");
			tr.append($('<td>' + stat.name + '</td>'));
			tr.append($('<td>' + value[0] + '</td>'));
			tr.append($('<td>' + formatMemory(value[1]) + '</td>'));
			tr.append($('<td>' + formatMemory(value[2]) + '</td>'));
			tr.append($('<td>' + formatMemory(value[3]) + '</td>'));
			tr.append($('<td>' + formatMemory(value[4]) + '</td>'));
			memoryTable.append(tr);

		}
		gcDiv.append(memoryTable);

		return gcDiv;
	};

	var parseGCReport = function(gcReport) {
		var report = {
			gcEvents : [],
			memoryStats : []
		};

		var reportLines = gcReport.split("\n");
		for (var i = 0; i < reportLines.length; i++) {
			var entry = reportLines[i].split(";");
			var name = entry[0]
			var value = entry[1];
			var metric = entry[2];

			report[name] = value + " " + metric;

			if (memoryStatsTypes.indexOf(name) > -1) {
				report.memoryStats.push({
					name : name,
					values : value,
					metric : metric
				});
			}

			for (var j = 0; j < gcEventTypes.length; j++) {
				var gcType = gcEventTypes[j];

				if (name != gcType) {
					gcType = 'GC ' + gcType;
				}

				if (name == gcType || name.indexOf(':') > -1) {
					report.gcEvents.push({
						name : name,
						values : value,
						metrics : metric
					});
					break;
				}
			}

		}

		return report;
	};

	var parseTest = function(text, eventsTableWrapper) {

		var testJSON = {};

		var testProps = parseProperties(text);
		testJSON.testPropeties = testProps;
		var testId = testJSON.testId = testProps['test.id'];
		var testTag = testJSON.testTag = testProps['test.tag'];
		testJSON.testStart = testProps['test.start'];
		testJSON.testStop = testProps['test.stop'];
		testJSON.testCancel = testProps['test.cancel'];

		testProps.responseText = text;
		testJSON.testName = testName = testProps['test.name'];
		var testTargets = testProps['test.target'].split(";");
		testJSON.targetsList = testTargets;
		testJSON.targets = {};

		var targetsTasks = new Array();
		for (var targetIdx = 0; targetIdx < testTargets.length; targetIdx++) {
			var targetName = testTargets[targetIdx];
			testJSON.targets[targetName] = {};
			var targetAjax = $.ajax({
				type : "GET",
				url : ptmTestViewer.testsRepository + testId + '/' + targetName
						+ '.properties',
				targetName : targetName,

			});

			targetAjax
					.done(function(data) {
						var targetProps = parseProperties(data);
						targetProps.responseText = data;
						targetProps.targetName = this.targetName;

						testJSON.targets[this.targetName].tiers = targetProps.TIERS
								.split(";");
						//Sandy
						testJSON.targets[this.targetName].product = targetProps.PRODUCT
								.split(";");
						testJSON.targets[this.targetName].targetPropetries = targetProps;

					});
			targetsTasks.push(targetAjax);

		}

		$.when.apply($, targetsTasks).then(function() {
			console.log('got all files');

			getELoggingCharts(testJSON);
			getGcLogs(testJSON);
			getAWR(testJSON);
			getThreadDumps(testJSON);
			getShadowtail(testJSON);
			renderArtifacts(eventsTableWrapper, testJSON)

		});

		return testJSON;
	};

	var getAWR = function(testJSON) {
		testJSON.awr = new Array();

		for (var targetIdx = 0; targetIdx < testJSON.targetsList.length; targetIdx++) {
			var targetName = testJSON.targetsList[targetIdx];
			var targetJSON = testJSON.targets[targetName];
			var targetPropetries = targetJSON.targetPropetries;
			var testProperties = testJSON.testPropeties;

			targetJSON.awr = new Array();

			var target = targetName;

			var awrReport = testProperties[target + '.db.awr'];

			var awr = new Object();
			awr.target = target;
			awr.awrReport = awrReport;

			targetJSON.awr.push(awr);
			testJSON.awr.push(awr);

		}
	};

	var testSelectionChange = function(selctedTest, eventsTableWrapper) {

		$.ajax(
				ptmTestViewer.testsRepository + selctedTest
						+ '/config.properties').done(function(testData) {
			var test = parseTest(testData, eventsTableWrapper);
			ptmTestViewer.tests[selctedTest] = test;

		});

	};

	var getSeriesFromJSON = function(events, property) {
		propert = property.toLowerCase();
		if (!events.series) {
			events.series = {};
		}
		if (!events.series[property]) {
			var series = [];
			events.series[property] = series;
			var i = 0;
			for (i = 0; i < events.AGG.length; i++) {
				series
						.push([ events.AGG[i].Time,
								events.AGG[i].data[property] ]);
			}
		}
		return events.series[property];
	};

	var getSeriesFromCSV = function(config, csvData) {

		var series = [];

		for (var i = 0; i < csvData.length; i++) {
			var value = csvData[i][config.name];
			if (config.name == "Heap-Memory-Used") {
				value = value / 1024 / 1024;
			}

			series.push([ csvData[i].Time, parseFloat(value) ]);
		}

		return series;
	};

	var getSeriesFromArray = function(events, property, test) {
		if (!events.series) {
			events.series = {};
		}
		if (!events.series[property]) {
			var series = [];
			events.series[property] = series;
			var i = 0;
			for (i = 0; i < events.AGG.length; i++) {
				series
						.push([
								events.AGG[i][0],
								events.AGG[i][1][test.config.aggregationTypesIdx[property]] ]);
			}
		}
		return events.series[property];
	}

	var redrawChart_fromTableSelection = function(id) {

		var fileNames = [];
		var selections = [];
		for ( var x in ptmTestViewer.selectedCharts) {
			var selectedChart = ptmTestViewer.selectedCharts[x];
			if (selectedChart) {

				var name = selectedChart.name;
				var env = selectedChart.env;
				var logFile = selectedChart.logFile;

				var testName = selectedChart.testName;

				var fileName = '/artifacts/'+ ptmTestViewer.env + '/shadowtail/' + env + '/' + logFile;
				selections.push({

					selectedChart : selectedChart,
					fileName : fileName
				});

				fileNames.push(fileName);
			}
		}
		var tasks = new Array();
		for (var i = 0; i < selections.length; i++) {
			var sel = selections[i];

			var task = $.ajax({
				type : "GET",
				url : sel.fileName,
				selection : sel
			});

			task.done(function(data) {
				console.log('got: ' + this.url);
				var csv = $.csv.toObjects(data, {
					separator : " "
				});
				this.csvData = csv;
				// 
			});

			tasks.push(task);

		}

		var xx = $.when.apply($, tasks).then(
				function() {
					console.log('got all files');
					var chartSeries = [];
					var seriesNames = [];

					for (var i = 0; i < selections.length; i++) {

						var data = selections[i].selectedChart;
						var env = data.env;
						var logFile = data.logFile;
						var name = data.name;

						var csvData = this instanceof Array ? this[i].csvData
								: this.csvData;
						chartSeries.push(getSeriesFromCSV(data, csvData));
						seriesNames.push({
							rendererOptions : {
								smooth : true
							},
							label : env + ' | ' + logFile + ' | ' + data.name
						});
					}
					createNewCanvas();
					drawChart(id, chartSeries, seriesNames);

				});

	}

	var centerOption = function(name) {
		return {
			"sTitle" : name,
			"sClass" : "center"
		};
	};

	var prepareColumnNames = function(aggregationTypes) {

		var columns = [

		{
			"sTitle" : "Name"
		} ];

		for ( var aIdx in aggregationTypes) {
			var columnName = aggregationTypes[aIdx];
			if (columnName == 'Name') {
				continue;
			}
			columns.push(centerOption(getColumnName(columnName)));
		}
		return columns;
	};

	var getColumnName = function(aggregationType) {
		var columnName = aggregationType ? aggregationType : '';

		if (columnName == 'CNT') {
			columnName = 'Count';
		} else if (columnName == 'AVG') {
			columnName = 'Average';
		} else if (columnName == 'MED') {
			columnName = 'Median';
		} else if (columnName == 'ERR') {
			columnName = 'Errors';
		} else if (columnName == 'ERR') {
			columnName = 'Errors';
		} else if (columnName == 'ST_DEV') {
			columnName = 'St Dev';
		} else if (columnName.indexOf("PERCENTILE_") > -1) {
			columnName = columnName.split("_")[1] + "th";
		}

		return columnName;
	}

	var drawEventsTable = function(tableHolder, aDataSet, collumns,
			testsSelect, logSelect) {

		var testName = testsSelect.val();
		var logName = logSelect.val();

		var columns = prepareColumnNames(collumns);
		var eventsTable = $(tableHolder).dataTable(
				{
					"aaData" : aDataSet,
					"aLengthMenu" : [ [ 5, 10, 20, 40, 80, -1 ],
							[ 5, 10, 20, 40, 80, "All" ] ],
					"bDestroy" : true,
					"bJQueryUI" : true,
					"sPaginationType" : "full_numbers",
					"aoColumns" : columns
				});

		$(eventsTable.fnGetNodes()).each(function() {
			var sTitle;
			var nTds = $('td', this);
			var name = $(nTds[0]).text();

			var clickParams = {
				'env' : testName,
				'logFile' : logName,
				'name' : name
			};

			$(nTds[0]).click(clickParams, ptmTestViewer.eventSelected)

		});
	}

	var eventSelected = function(event) {
		if (!ptmTestViewer.selectedCharts) {
			ptmTestViewer.selectedCharts = {};
		}
		var name = event.data.name;
		var env = event.data.env;
		var logFile = event.data.logFile;

		var key = env + '_' + logFile + '_' + name;
		if (ptmTestViewer.selectedCharts[key]) {
			$(event.target).removeClass('selectedEvent');
			ptmTestViewer.selectedCharts[key] = undefined;
		} else {
			$(event.target).addClass('selectedEvent');
			ptmTestViewer.selectedCharts[key] = event.data;
		}
	}

})();
