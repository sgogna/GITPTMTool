shadowtailCharts = {
	tests : {},
	chartsCount : 0,
	plots : [],
	eLoggingTests : [],
	environments : [],
	parameters : [],
	deeplinks : [],
	ignoreDateStamp : true,

	initialize : function() {
		$.jqplot.config.enablePlugins = true;

		var parameters = decodeURI(window.location.search).slice(1).split('&');
		var parameters_new = new Object();
		for (var i = 0; i < parameters.length; i++) {
			var param = parameters[i].split('=');
			if ('deeplink[]' == param[0]) {
				var vars = param[1].split(':');
				shadowtailCharts.deeplinks.push({
					target : vars[0],
					logFile : vars[1],
					metric : vars[2],
					ptmEnv : vars[3]
				});
			} else {
				parameters_new[param[0]] = param[1];
			}
		}

		shadowtailCharts.parameters = parameters_new;
		$.ajax('environmentsList').done(function(data) {
			shadowtailCharts.environments = data.sort();
			shadowtailCharts.addNewChartBox();
			var chartCanvas = $('<div class="spacer"><div id="chart_canvas" class="chartCanvas"></div></div>');
			$('#shadowtailChartsContainer').append(chartCanvas);

			shadowtailCharts.processDeeplinks();

		})

	},
	processDeeplinks : function() {
		 
		var targetPromises = new Array();
		var logPromises = new Array();

		for (var i = 1; i < shadowtailCharts.deeplinks.length; i++) {
			shadowtailCharts.addNewChartBox();
		}
		for (var i = 0; i < shadowtailCharts.deeplinks.length; i++) {

			var target = shadowtailCharts.deeplinks[i]['target'];
			if (target && shadowtailCharts.environments.indexOf(target) > -1) {
				var promise = shadowtailCharts.testSelectionChange(target, $($('.eventsTableWrapper')[i]));
				targetPromises.push(promise);
			}
		}

		var xx = $.when.apply($, targetPromises).then(function(data) {

			for (var i = 0; i < shadowtailCharts.deeplinks.length; i++) {
				var target = shadowtailCharts.deeplinks[i]['target'];
				var logFile = shadowtailCharts.deeplinks[i]['logFile'];
				var promise = shadowtailCharts.logSelectChange(target, logFile, $($('.tableWraper')[i]));
				logPromises.push(promise);

			}

			var yy = $.when.apply($, logPromises).done(function(data) {

				for (var i = 0; i < shadowtailCharts.deeplinks.length; i++) {
					var target = shadowtailCharts.deeplinks[i]['target'];
					var logFile = shadowtailCharts.deeplinks[i]['logFile'];
					var metric = shadowtailCharts.deeplinks[i]['metric'];

					var event = {
						data : {
							'env' : target,
							'logFile' : logFile,
							'name' : metric
						}
					}
					shadowtailCharts.eventSelected(event);

				}
				shadowtailCharts.redrawChart_fromTableSelection(0);
				$('.dataTables_wrapper').each(function(wrapped) {
					$(this).fadeOut();
				});

				$('.eventsTableWrapper').each(function(wrapped) {
					$(this).fadeOut();
				});

				$('.chartBox').each(function(wrapped) {
					$(this).fadeOut();
				});
			});

		});

	},
	addNewChartBox : function() {
		var chartBox = shadowtailCharts.createChartBox();
		var container = $('#shadowtailChartsContainer');
		container.append(chartBox);
		this.chartsCount++;
		return chartBox;
	},
	createChartBox : function() {
		var chartBox = $('<div id="chart_box" class="chartBox"></div>');
		var testsSelect = $('<select id="chart_testsSelect" class="chart_testsSelect select"></select>');
		var eventsTableWrapper = $('<div id="eventsTableWrapper" class="spacer eventsTableWrapper"></div>');

		testsSelect.change(function() {

			var targetName = $(this).parent().find('.chart_testsSelect').val();
			shadowtailCharts.testSelectionChange(targetName, $(this).parent().find('.eventsTableWrapper'));
		});

		var id = this.chartsCount;
		shadowtailCharts.populateAvailableTests(testsSelect, id);

		var drawButton = $('<button id="chart_drawButton_' + this.chartsCount + ' type="button" class="button">Redraw</button>');
		drawButton.click(function() {
			shadowtailCharts.redrawChart_fromTableSelection(id);
		});

		var clearSelectionButton = $('<button id="chart_clearSelectionButton_' + this.chartsCount + ' type="button" class="button">Clear selection</button>');
		clearSelectionButton.click(function() {
			shadowtailCharts.selectedCharts = undefined;
			$('table tbody tr td.selectedEvent').each(function() {
				$(this).removeClass('selectedEvent');
			})
		});

		var additionalTests = $('<button type="button" class="button">Additional test</button>');
		additionalTests.click(shadowtailCharts.addNewChartBox);

		var ignoreDateStampCheckBox = $('<input type="checkbox" checked>ignore date stamp</input>');
		ignoreDateStampCheckBox.click(function() {
			shadowtailCharts.ignoreDateStamp = !shadowtailCharts.ignoreDateStamp;
		});
		
		chartBox.append(testsSelect);
		chartBox.append(drawButton);
		chartBox.append(clearSelectionButton);
		chartBox.append(additionalTests);
//		chartBox.append(ignoreDateStampCheckBox);
		// chartBox.append(additionalTestButton);

		chartBox.append(eventsTableWrapper);
		// chartBox.append(additionalTests);

		return chartBox;
	},
	compareTests : function(tests, text) {
		return $('<option value="' + value + '">' + text + '</option>');
	},
	createSelectOption : function(value, text) {
		return $('<option value="' + value + '">' + text + '</option>');
	},

	populateAvailableCompareTests : function(testsSelect) {
		for (var i = 0; i < shadowtailCharts.eLoggingTests.length; i++) {
			var value = shadowtailCharts.eLoggingTests[i];
			testsSelect.append($('<option value="' + value + '">' + value + '</option>'));
		}
	},
	populateAvailableTests : function(testsSelect, id) {

		testsSelect.data({
			id : this.chartsCount
		});

		testsSelect.append(this.createSelectOption('', 'select env ...'));
		var i = 0;
		for (i = 0; i < shadowtailCharts.environments.length; i++) {
			var value = shadowtailCharts.environments[i];
			testsSelect.append(this.createSelectOption(value, value));
		}
	},
	createNewCanvas : function() {
		var canvas = $('#chart_canvas');
		var newCanvas = $('<div id="chart_canvas" class="chartCanvas"></div>');
		canvas.replaceWith(newCanvas);

	},
	prepareStatisticsForTableRendering : function(selctedTestId) {

		var selectedTest = shadowtailCharts.tests[selctedTestId];
		var config = selectedTest.config;
		var aggregationTypes = config.aggregationTypes;
		var types = selectedTest.eventTypes;

		var tableDataSet = [];
		for ( var idx in types) {
			var type = types[idx];
			var names = shadowtailCharts.tests[selctedTestId]['type'][type].eventNames;
			var j = 0;
			for (j = 0; j < names.length; j++) {

				var eventData = shadowtailCharts.tests[selctedTestId]['type'][type][names[j]];
				var statistics = eventData.statistics;
				var errorRate = 0;
				if (statistics.CNT == 0) {
					errorRate = 100.00;
				} else {
					errorRate = (statistics.ERR / statistics.CNT * 100).toFixed(2);
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

	},
	testSelectionChange : function(selctedTest, eventsTableWrapper) {

		var promise = $.ajax('availableLogs?target=' + selctedTest);
		promise.done(function(data) {
			eventsTableWrapper.find('*').remove();
			eventsTableWrapper.append($('<div class="spacer"><a href="/artifacts/'+getPtmEnv(shadowtailCharts)+'/shadowtail/' + selctedTest + '/report.csv"> (Report) ' + selctedTest + '</a></div>'))
			var logSelect = $('<select class="chart_LogSelect select"></select>');
			var tableWraper = $('<div class="tableWraper spacer"/>');
			logSelect.append(shadowtailCharts.createSelectOption('', 'select log file...'));
			data.sort();
			for (var i = 0; i < data.length; i++) {
				var value = data[i];
				logSelect.append(shadowtailCharts.createSelectOption(value, value, tableWraper));
			}

			logSelect.change(function() {
				var logFile = logSelect.val();
				shadowtailCharts.logSelectChange(selctedTest, logFile, tableWraper);

			})

			eventsTableWrapper.append(logSelect);
			eventsTableWrapper.append(tableWraper);

		});

		return promise;

	},
	logSelectChange : function(selctedTest, logFile, tableWraper) {

		var deferred = $.Deferred();

		tableWraper.find('*').remove();
		var select = this;

		var logFilePath = 'report?target=' + selctedTest + '/' + logFile;
		var promise = $.ajax(logFilePath);
		promise.done(function(report) {

			var eventsTable = $('<table cellpadding="0" cellspacing="0" border="0" class="display" id="chart_EventsTable_' + this.chartsCount + '"></table>');
			tableWraper.append(eventsTable);

			var headers = report.split("\n")[0].split(",");
			var stats = $.csv.toObjects(report, {
				separator : ","
			});
			var links = '<div class="spacer"><a href="/artifacts/'+getPtmEnv(shadowtailCharts)+'/shadowtail/' + selctedTest + '/' + logFile + '"> (Log) ' + logFile + '</a></div>'
			tableWraper.append($(links));
			links = '<div class="spacer"><a href="/artifacts/'+getPtmEnv(shadowtailCharts)+'/shadowtail/' + selctedTest + '/' + logFile + '.report.csv"> (Report) ' + logFile + '.report.csv</a></div>'
			tableWraper.append($(links));
			var tableData = [];
			for (var i = 0; i < stats.length; i++) {
				var entry = [];
				for (var j = 0; j < headers.length; j++) {

					var value = stats[i][headers[j]];
					if (headers[j] != "Name" && stats[i].Name == "Heap-Memory-Used") {
						// value = Math.round(value /1024.0/1024.0*100)/100;\
						value = Math.round(value / 1024.0 / 1024.0);
					}

					entry.push(value)
				}
				tableData.push(entry);
			}
			shadowtailCharts.drawEventsTable(eventsTable, tableData, headers, selctedTest, logFile);
			deferred.stats = stats;
			deferred.resolve();
		});
		return deferred;

	},
	drawChart : function(chartIdx, seriesValues, seriesNames,multiDay) {
		shadowtailCharts.plots[chartIdx] = $.jqplot('chart_canvas', seriesValues, {
			title : '',
			legend : {
				show : true,
				showLabels:true,
				showSwatch: true,
				renderer : $.jqplot.EnhancedLegendRenderer,
				placement : 'outside',
				location : 's'
			},
//			animate : true,
			seriesDefaults : {
				showMarker : false,
				lineWidth : 1,
				markerOptions : {
					style : "circle",
					size : 1
				},
				showLine : true
			},
			series : seriesNames,
			axes : {
				xaxis : {
					renderer : $.jqplot.DateAxisRenderer,
					tickOptions : {
					 
						formatString : multiDay ? '%d%b %T': '%T'
					},
					numberTicks : 15
				},
				yaxis : {
					// max:2000,
					// min:457,
					tickOptions : {
					// formatString: '$%.2f'
					}
				}
			},
			highlighter : {
				sizeAdjust : 10,
				tooltipLocation : 'n',
				bringSeriesToFront : true,
//				 useAxesFormatters: false,
				ssformatString : '<div class="jqplot-highlighter"><span>#seriesLabel#</span>%s: <strong>%s</strong></div>'
			},
			cursor : {
				show : true,
				zoom : true
			}
		});
	},

	getSeriesFromJSON : function(events, property) {
		propert = property.toLowerCase();
		if (!events.series) {
			events.series = {};
		}
		if (!events.series[property]) {
			var series = [];
			events.series[property] = series;
			var i = 0;
			for (i = 0; i < events.AGG.length; i++) {
				series.push([ events.AGG[i].Date +' '+ events.AGG[i].Time, events.AGG[i].data[property] ]);
			}
		}
		return events.series[property];
	},

	getSeriesFromCSV : function(config, csvData, includeDay) {

		var series = [];

		 
		for (var i = 0; i < csvData.length; i++) {
			var value = csvData[i][config.name];
			if (config.name == "Heap-Memory-Used") {
				value = value / 1024.0 / 1024;
			}

			var dateTime = includeDay?  csvData[i].Date + ' ' + csvData[i].Time : csvData[i].Time;
			series.push([ dateTime, parseFloat(value) ]);
		}

		return series;
	},
	getSeriesFromArray : function(events, property, test) {
		if (!events.series) {
			events.series = {};
		}
		if (!events.series[property]) {
			var series = [];
			events.series[property] = series;
			var i = 0;
			for (i = 0; i < events.AGG.length; i++) {
				series.push([ events.AGG[i][0], events.AGG[i][1][test.config.aggregationTypesIdx[property]] ]);
			}
		}
		return events.series[property];
	},

	redrawChart_fromTableSelection : function(id) {

		var fileNames = [];
		var selections = [];
		for ( var x in shadowtailCharts.selectedCharts) {
			var selectedChart = shadowtailCharts.selectedCharts[x];
			if (selectedChart) {

				var name = selectedChart.name;
				var env = selectedChart.env;
				var logFile = selectedChart.logFile;

				var testName = selectedChart.testName;

				var fileName = '/artifacts/'+getPtmEnv(shadowtailCharts)+'/shadowtail/' + env + '/' + logFile;
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
				context : sel
			});

			task.done(function(data) {
				console.log('got: ' + this.url);
				var csv = $.csv.toObjects(data, {
					separator : " "
				});
				this.csvData = csv;
				this.dateStart = csv[0].Date;
				this.dateEnd = csv[csv.length-1].Date;
				this.multiDay = this.dateStart!=this.dateEnd;
				// 
			});

			tasks.push(task);

		}

		var xx = $.when.apply($, tasks).then(function() {
			console.log('got all files');
			var chartSeries = [];
			var seriesNames = [];

			var multiDay = false;
			for (var i = 0; i < selections.length; i++) { 
				if ( selections[i].multiDay){
					multiDay = true;
					break;
				}
			}
			
			for (var i = 0; i < selections.length; i++) {
				 
				var selectedChart = selections[i].selectedChart;
				var env = selectedChart.env;
				var logFile = selectedChart.logFile;
				var name = selectedChart.name;

				var csvData = this instanceof Array ? this[i].csvData : this.csvData; //multiple ajax responses
				chartSeries.push(shadowtailCharts.getSeriesFromCSV(selectedChart, csvData, multiDay));
				seriesNames.push({
					rendererOptions : {
//						smooth : true
					},
					label : env + ' | ' + logFile + ' | ' + selectedChart.name
				});
			}
			shadowtailCharts.createNewCanvas();
			shadowtailCharts.drawChart(id, chartSeries, seriesNames,multiDay);

		});

	},
	centerOption : function(name) {
		return {
			"sTitle" : name,
			"sClass" : "center"
		};
	},

	prepareColumnNames : function(aggregationTypes) {

		var columns = [

		{
			"sTitle" : "Name"
		} ];

		for ( var aIdx in aggregationTypes) {
			var columnName = aggregationTypes[aIdx];
			if (columnName == 'Name') {
				continue;
			}
			columns.push(shadowtailCharts.centerOption(shadowtailCharts.getColumnName(columnName)));
		}
		return columns;
	},

	getColumnName : function(aggregationType) {
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
	},

	drawEventsTable : function(tableHolder, aDataSet, collumns, testName, logName) {

		var columns = shadowtailCharts.prepareColumnNames(collumns);
		var eventsTable = $(tableHolder).dataTable({
			"aaData" : aDataSet,
			"aLengthMenu" : [ [ 5, 10, 20, 40, 80, -1 ], [ 5, 10, 20, 40, 80, "All" ] ],
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

			$(nTds[0]).click(clickParams, shadowtailCharts.eventSelected)

		});
	},

	eventSelected : function(event) {
		if (!shadowtailCharts.selectedCharts) {
			shadowtailCharts.selectedCharts = {};
		}
		var name = event.data.name;
		var env = event.data.env;
		var logFile = event.data.logFile;

		var key = env + '_' + logFile + '_' + name;
		if (shadowtailCharts.selectedCharts[key]) {
			$(event.target).removeClass('selectedEvent');
			shadowtailCharts.selectedCharts[key] = undefined;
		} else {
			$(event.target).addClass('selectedEvent');
			shadowtailCharts.selectedCharts[key] = event.data;
		}
	}

};

var getPtmEnv = function(shadowtailCharts) {
	var ptm_env = "";
	for (var i = 0; i < shadowtailCharts.deeplinks.length; i++) {
			ptm_env = shadowtailCharts.deeplinks[i]['ptmEnv'];
	}
	return ptm_env;
}