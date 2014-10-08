eLoggingCharts = {
	tests : {},
	chartsCount : 0,
	plots : [],
	eLoggingTests : [],
	// nestedFolder : 'elogging',
	testsRootFolder : "js/eLogging/tests/",
	ignoreDateStamp : true,
	stack : false,
	smooth : true,
	bar : false,
	fixTimeStamps : false,
	redraw : true,
	loadedId : null,
	deeplinks : [],

	initialize : function() {
		eLoggingCharts.fixBrowser();
		$.jqplot.config.enablePlugins = true;
		var dynamicTestRetrieval = true;

		var parameters = decodeURI(window.location.search).slice(1).split('&');
		var parameters_new = new Object();
		for (var i = 0; i < parameters.length; i++) {
			var param = parameters[i].split('=');
			if ('deeplink[]' == param[0]) {
				var vars = param[1].split(':');
				eLoggingCharts.deeplinks.push({
					testRoot : vars[0],
				// logFile : vars[1],
				// metric : vars[2]
				});
			} else {
				parameters_new[param[0]] = param[1];
			}
		}

		eLoggingCharts.parameters = parameters_new;

		var callback = function() {
			eLoggingCharts.createChartBox();
			eLoggingCharts.createAddCommentsBox();
			eLoggingCharts.restoreWindow();
			eLoggingCharts.processDeeplinks();

		};

		if (dynamicTestRetrieval) {
			$.ajax('testsList').done(function(data) {
				eLoggingCharts.eLoggingTests = data;
				callback();
			})
		} else {
			YUI().Get.script('js/eLogging/tests.js', {
				onSuccess : function(o) {
					callback();
				}
			});
		}
	},
	fixBrowser : function() {
		var matched, browser;

		jQuery.uaMatch = function(ua) {
			ua = ua.toLowerCase();

			var match = /(chrome)[ \/]([\w.]+)/.exec(ua) || /(webkit)[ \/]([\w.]+)/.exec(ua) || /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) || /(msie) ([\w.]+)/.exec(ua) || ua.indexOf("compatible") < 0
					&& /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) || [];

			return {
				browser : match[1] || "",
				version : match[2] || "0"
			};
		};

		matched = jQuery.uaMatch(navigator.userAgent);
		browser = {};

		if (matched.browser) {
			browser[matched.browser] = true;
			browser.version = matched.version;
		}

		// Chrome is Webkit, but Webkit is also Safari.
		if (browser.chrome) {
			browser.webkit = true;
		} else if (browser.webkit) {
			browser.safari = true;
		}

		jQuery.browser = browser;
	},
	processDeeplinks : function() {

		for (var i = 1; i < eLoggingCharts.deeplinks.length; i++) {
			eLoggingCharts.additionalTest();
		}

		for (var i = 0; i < eLoggingCharts.deeplinks.length; i++) {

			var root = eLoggingCharts.deeplinks[i].testRoot;
			var testId = root.split("/");
			testId = testId[testId.length - 1];

			eLoggingCharts.downloadConfigAndStatistics({
				id : testId,
				testRoot : root
			}, function(ctx) {
				eLoggingCharts.tests[ctx.testId].config.testRoot = ctx.testRoot;
				var wrapper = YUI3.Node.all('.eventsTableWrapper')._nodes[ctx.index];
				eLoggingCharts.configDownloadCallback(eLoggingCharts.tests[ctx.testId], YUI3.Node.one(wrapper))
			}, {
				index : i,
				testId : testId,
				testRoot : root
			});

		}
	},

	restoreWindow : function() {
		var params = location.search.replace('?', '').split('&').map(function(val) {
			return val.split('=');
		});

		if (params[0][0] == "load") {
			eLoggingCharts.loadedId = params[0][1];
			eLoggingCharts.restoreWindowByValue(eLoggingCharts.loadedId);
		}

		$(document).ajaxStop(function() {
			if (eLoggingCharts.selectedCharts && eLoggingCharts.redraw) {
				eLoggingCharts.highlightCharts();
				eLoggingCharts.redrawChart_fromTableSelection(0);
				eLoggingCharts.redraw = false;
			}
		});
	},

	restoreWindowByValue : function(value) {
		$.ajax({
			type : "POST",
			url : "serializer",
			data : {
				"load" : value
			},
			success : function(sData, sTextStatus, oXMLHttpRequest) {
				if (sData) {
					eLoggingCharts.restoreCompareTests(sData);
					eLoggingCharts.restoreTests(sData);
				}

				eLoggingCharts.createShowCommentsBox();
				eLoggingCharts.redraw = true;
			},
			error : function(oXMLHttpRequest, sTextStatus, oErrorThrown) {
				console.log("Deserialize error!");
			}
		})
	},

	restoreTests : function(data) {
		var tests = data.tests;

		if (data.selectedMetrics)
			eLoggingCharts.selectedCharts = jQuery.parseJSON(data.selectedMetrics);

		for (var i = 0; i < tests.length; i++) {
			if (i == 0) {
				$('#testSelect' + i).val(tests[i]);
				eLoggingCharts.testSelectionChange(YUI3.one('#testSelect' + i), YUI3.one('#spacer'));
			} else {
				$('#chart_additionalTestButton_0').click();
				$('#testSelect' + i).val(tests[i]);
				eLoggingCharts.testSelectionChange(YUI3.one('#testSelect' + i), YUI3.one('#additionalEventTable' + i));
			}
		}
		;
	},

	restoreCompareTests : function(data) {
		var compareTests = data.compareTests;

		compareTests.forEach(function() {
			$('#chart_additionalCompareTestButton_0').click();
		});

		var i = 0;

		$('div#compareTests_0 .chart_testsSelect').each(function() {
			$(this).val(compareTests[i].item);

			if (compareTests[i].item.length == 2) {
				$('div#compareTests_0 .button')[2 * i + 1].click();
			}
			i++;
		})
	},

	serializeData : function() {
		var text = JSON.stringify(eLoggingCharts.createObjectToSerialize(), null, 2);
		$.ajax({
			type : "POST",
			url : "serializer",
			data : {
				"save" : text
			},
			success : function(sData, sTextStatus, oXMLHttpRequest) {
				window.prompt("Copy to clipboard: Ctrl+C, Enter", location.protocol + '//' + location.host + location.pathname + "?load=" + sData);
				eLoggingCharts.createShowCommentsBox();
			},
			error : function(oXMLHttpRequest, sTextStatus, oErrorThrown) {
				alert("Serialize error!");
			}
		})

		return "Just fine...";
	},

	createObjectToSerialize : function() {
		var serializedObject = {
			owner : "",
			email : "",
			desc : "",
			tests : [],
			compareTests : [],
			selectedMetrics : ""
		}

		var selectedCharts = JSON.stringify(eLoggingCharts.selectedCharts, null, 2);

		serializedObject.selectedMetrics = selectedCharts;
		serializedObject.owner = $('#panel1 #form #name').val();
		serializedObject.email = $('#panel1 #form #email').val();
		serializedObject.desc = $('#panel1 #form #desc').val();

		serializedObject.tests = eLoggingCharts.getSelectedTests();
		serializedObject.compareTests = eLoggingCharts.getSelectedCompareTests();

		return serializedObject;
	},

	getSelectedTests : function() {
		var tests = [];

		tests.push($('select#testSelect0').val());

		$('#additionalTests_0 select.chart_testsSelect').each(function() {
			tests.push($(this).val());
		});

		return tests;
	},

	getSelectedCompareTests : function() {
		var tests = [];

		$('div#compareTests_0 .chart_testsSelect').each(function() {
			var selectedItems = {
				item : []
			};

			$(this).children(':selected').each(function() {
				selectedItems.item.push($(this).text());
			});
			tests.push(selectedItems);
		})

		return tests;
	},

	createAddCommentsBox : function() {
		$('#panel1 #form #send').click(function() {
			eLoggingCharts.serializeData();
			return false;
		});
	},

	createShowCommentsBox : function() {
		var tests = eLoggingCharts.getSelectedTests();

		$.ajax({
			type : "POST",
			url : "serializer",
			data : {
				"comments" : tests
			},
			success : function(sData, sTextStatus, oXMLHttpRequest) {
				eLoggingCharts.showComments(sData);
			},
			error : function(oXMLHttpRequest, sTextStatus, oErrorThrown) {
				console.log("Comments read error!");
			}
		});
	},

	showComments : function(data) {
		eLoggingCharts.hideComments();

		if (data.length) {
			var showComments = $('<button type="button" class="button" id="showComments">Show Comments (' + data.length + ')</button>');
			showComments.click(function() {
				$('#correspondComments').toggle(200);
			});

			$('#trigger1').after(showComments);
			showComments.after('<ol id="correspondComments"></ol>');

			var deleteFunctionClosure = function(i) {
				return function() {
					console.log(i);

					$.ajax({
						type : "POST",
						url : "serializer",
						data : {
							"delete" : i
						},
						success : function(sData, sTextStatus, oXMLHttpRequest) {
							eLoggingCharts.createShowCommentsBox();
						},
						error : function(oXMLHttpRequest, sTextStatus, oErrorThrown) {
							console.log("Delete error!");
						}
					});
				}
			};

			var loadFunctionClosure = function(i) {
				return function() {
					window.location = i;
				}
			};

			var copyLinkFunctionClosure = function(i) {
				return function() {
					window.prompt("Copy to clipboard: Ctrl+C, Enter", i);
				}
			};

			var getSerializedObject = function(id) {
				var objectToSerialize = eLoggingCharts.createObjectToSerialize();
				objectToSerialize.id = id;

				return JSON.stringify(objectToSerialize, null, 2);
			}

			var editFunctionClosure = function(owner, email, desc, id) {
				var clicked = false;

				return function() {
					if (!clicked) {
						$('#panel1').slidePanel({
							triggerName : '#editButton' + id,
							position : 'fixed',
							panelTopPos : '0',
							ajax : false
						});

						$(this).mousedown();
						clicked = true;
					}

					$('#panel1 #name').val(owner);
					$('#panel1 #email').val(email);
					$('#panel1 #desc').val(desc);

					$('#panel1 #send').hide();
					$('#panel1 #update').show();

					$('#panel1 #update').click(function() {
						$.ajax({
							type : "POST",
							url : "serializer",
							data : {
								"update" : getSerializedObject(id)
							},
							success : function(sData, sTextStatus, oXMLHttpRequest) {
								eLoggingCharts.createShowCommentsBox();
							},
							error : function(oXMLHttpRequest, sTextStatus, oErrorThrown) {
								console.log("Update error!");
							}
						});

						return false;
					});
				}
			};

			for ( var i in data) {
				var comment = jQuery.parseJSON(data[i]);

				var container = $('<li/>');

				container.append('<p><em> (' + comment.id + ') [' + comment.tests.join("] [") + ']</em></p>');

				container.append('<p><b>Owner:</b> ' + comment.owner + '</p>');
				container.append('<p><b>Email:</b> <a href="mailto:' + comment.email + '">' + comment.email + '</p>');
				container.append('<p><b>Description:</b> ' + comment.desc + '</p>');

				var goButton = $('<button type="button" class="button">Go to snapshot</button>');
				var pathname = location.protocol + '//' + location.host + location.pathname + "?load=" + comment.id;
				goButton.click(loadFunctionClosure(pathname));

				var deleteButton = $('<button type="button" class="button">Delete</button>');
				deleteButton.click(deleteFunctionClosure(comment.id));

				var copyButton = $('<button type="button" class="button">Copy to clipboard</button>');
				copyButton.click(copyLinkFunctionClosure(pathname));

				if (eLoggingCharts.loadedId != null && parseInt(eLoggingCharts.loadedId) == comment.id) {
					var editButton = $('<button type="button" class="button" id="editButton' + comment.id + '">Edit</button>');
					editButton.click(editFunctionClosure(comment.owner, comment.email, comment.desc, comment.id));
				}

				var buttonsContainer = $('<p/>');

				buttonsContainer.append(goButton);
				buttonsContainer.append(deleteButton);
				buttonsContainer.append(copyButton);

				if (eLoggingCharts.loadedId != null && parseInt(eLoggingCharts.loadedId) == comment.id)
					buttonsContainer.append(editButton);

				container.append(buttonsContainer);

				$('#correspondComments').append(container);
			}

			$('#correspondComments').hide();
		}
	},

	hideComments : function() {
		if ($('#showComments')) {
			$('#showComments').remove();
			$('#correspondComments').remove();
		}
	},

	highlightCharts : function() {
		for (temp in eLoggingCharts.selectedCharts) {
			var chart = eLoggingCharts.selectedCharts[temp];

			var row = $('.' + chart.testName + ' tr:contains(' + chart.eventType + '):contains(' + chart.eventName + ')');

			row[0] && $(row[0].cells[$('body').data()[chart.chartType]]).addClass("selectedEvent");
		}
	},
	additionalTest : function() {

		var additionalTests = YUI3.Node.one('.additionalTests');

		var additionalTestHolder = YUI3.Node.create('<div class="spacer testHolder"></div>');
		var tableHolder = YUI3.Node.create('<div class="spacer eventsTableWrapper"></div>');
		var additionalEventsTable = YUI3.Node.create('<table cellpadding="0" cellspacing="0" border="0" id="additionalEventTable' + eLoggingCharts.chartsCount + '" class="display""/>');
		tableHolder.appendChild(additionalEventsTable);
		var testsSelect2 = YUI3.Node.create('<select id="testSelect' + eLoggingCharts.chartsCount++ + '" class="chart_testsSelect select"></select>');
		testsSelect2.on('change', function() {
			eLoggingCharts.createShowCommentsBox();
			eLoggingCharts.testSelectionChange(testsSelect2, additionalEventsTable);
		});
		var deleteButton = YUI3.Node.create('<button type="button" class="button">remove</button>');
		deleteButton.on('click', function() {
			additionalTests.removeChild(additionalTestHolder);
			eLoggingCharts.chartsCount--;
		});
		eLoggingCharts.populateAvailableTests(testsSelect2);
		additionalTestHolder.appendChild(testsSelect2);
		additionalTestHolder.appendChild(deleteButton);
		additionalTestHolder.appendChild(tableHolder);
		additionalTests.appendChild(additionalTestHolder);

	},

	createChartBox : function() {

		var container = YUI3.Node.one('#eloggingChartsContainer');

		var chartBox = YUI3.Node.create('<div id="chart_box_' + eLoggingCharts.chartsCount + '" class="chartBox"></div>');

		var chartCanvas = YUI3.Node.create('<div id="resizeable' + this.chartsCount + '" class=""><div id="chart_canvas_' + this.chartsCount + '" class="chartCanvas"></div></div>');
		var overeviewCanvas = YUI3.Node.create('<div id="resizeable' + this.chartsCount + '" class=""><div id="chart_canvas_' + this.chartsCount + '_overview" class="chartCanvas"></div></div>');

		var testsGroupSelect = YUI3.Node.create('<select class="chart_testsGroupSelect select"></select>');
		var testsSelect = YUI3.Node.create('<select id="testSelect' + eLoggingCharts.chartsCount + '" class="chart_testsSelect select"></select>');
		var testDetails = YUI3.Node.create('<div id="testDetails" class="hidden" />');

		var eventsTableWrapper = YUI3.Node.create('<div id="spacer" class="spacer eventsTableWrapper"></div>');

		testsSelect.on('change', function() {
			eLoggingCharts.createShowCommentsBox();
			eLoggingCharts.testSelectionChange(testsSelect, eventsTableWrapper);
		});
		var id = this.chartsCount;
		eLoggingCharts.populateAvailableTests(testsSelect, id);

		var drawButton = YUI3.Node.create('<button id="chart_drawButton_' + this.chartsCount + '" type="button" class="button">Redraw</button>');
		drawButton.on('click', function() {
			eLoggingCharts.redrawChart_fromTableSelection(id);
		});

		var clearSelectionButton = YUI3.Node.create('<button id="chart_clearSelectionButton_' + this.chartsCount + '" type="button" class="button">Clear selection</button>');
		clearSelectionButton.on('click', function() {
			eLoggingCharts.selectedCharts = undefined;
			$('table tbody tr td.selectedEvent').each(function() {
				$(this).removeClass('selectedEvent');
			})
		});

		var additionalTests = YUI3.Node.create('<div id="additionalTests' + '" class="additionalTests spacer"></div>');
		var additionalTestButton = YUI3.Node.create('<button id="chart_additionalTestButton_' + this.chartsCount + '" type="button" class="button">Additional test</button>');
		additionalTestButton.on('click', eLoggingCharts.additionalTest);

		var ignoreDateStampCheckBox = $('<input type="checkbox" checked>ignore date stamp</input>');
		ignoreDateStampCheckBox.click(function() {
			eLoggingCharts.ignoreDateStamp = !eLoggingCharts.ignoreDateStamp;
		});
		var stackCheckBox = $('<input type="checkbox" >stack</input>');
		stackCheckBox.click(function() {
			eLoggingCharts.stack = !eLoggingCharts.stack;
		});
		var smoothCheckBox = $('<input type="checkbox" checked >smooth</input>');
		smoothCheckBox.click(function() {
			eLoggingCharts.smooth = !eLoggingCharts.smooth;
		});

		var barCheckBox = $('<input type="checkbox" >bar</input>');
		barCheckBox.click(function() {
			eLoggingCharts.bar = !eLoggingCharts.bar;
		});

		var fixTimeStampsCheckBox = $('<input type="checkbox" >fix timeStamps</input>');
		fixTimeStampsCheckBox.click(function() {
			eLoggingCharts.fixTimeStamps = !eLoggingCharts.fixTimeStamps;
		});

		var compareTests = $('<div id="compareTests_' + this.chartsCount + '" class="additionalTests spacer"></div>');

		var compareTestsTestButton = $('<button id="chart_additionalCompareTestButton_' + this.chartsCount + '" type="button" class=button>Compare tests</button>');
		compareTestsTestButton.click(function() {
			var additionalTestHolder = $('<div class="spacer"></div>');
			var tableHolder = $('<div class="spacer"></div>');
			var additionalEventsTable = $('<table cellpadding="0" cellspacing="0" border="0" class="display""/>');
			tableHolder.append(additionalEventsTable);
			var testsSelect2 = $('<select class="chart_testsSelect select" MULTIPLE size=10></select>');
			testsSelect2.change(function() {
				if (testsSelect2.find('option:selected').length > 2) {
					alert('only 2 allowed');
				}
			});
			var deleteButton = $('<button type="button" class="button">remove</button>');
			deleteButton.click(function() {
				additionalTestHolder.remove();
			});
			var compareButton = $('<button type="button" class="button">compare</button>');
			compareButton.click(function() {
				var selectedOptions = testsSelect2.find('option:selected');
				if (selectedOptions.length != 2) {
					alert('2 required');
				} else {

					var tasks = [];
					for (var x = 0; x < selectedOptions.length; x++) {
						var task = eLoggingCharts.downloadConfigAndStatistics({
							id : selectedOptions[x].value
						}, function() {
						});
						tasks.push(task);
					}

					$.when.apply($, tasks).then(function(res) {
						console.log('got all files');

						var comparisonResult = eLoggingCharts.prepareCompareTableData(selectedOptions[0].value, selectedOptions[1].value);

						tableHolder.find('*').remove();
						var title = comparisonResult.test1 + " <b>vs</b> " + comparisonResult.test2;
						tableHolder.append($('<div class="spacer"><b>Values difference:</b> ' + title + '</div>'));
						var timeDiffTable = $('<table cellpadding="0" cellspacing="0" border="0" class="display""/>');
						tableHolder.append(timeDiffTable);
						var timePercentageDiffTable = $('<table cellpadding="0" cellspacing="0" border="0" class="display""/>');
						tableHolder.append($('<div class="spacer"><b>Percentage difference:</b> ' + title + '</div>'));
						tableHolder.append($('<div class="spacer"/>'));
						tableHolder.append(timePercentageDiffTable);

						var columns = eLoggingCharts.prepareColumnNames(comparisonResult.aggregationTypes);

						$(timeDiffTable).dataTable({
							"aaData" : comparisonResult.valuesDiff,
							"aLengthMenu" : [ [ 5, 10, 20, 40, 80, -1 ], [ 5, 10, 20, 40, 80, "All" ] ],
							"bDestroy" : true,
							"bJQueryUI" : true,
							"sPaginationType" : "full_numbers",
							"aoColumns" : columns
						});

						$(timePercentageDiffTable).dataTable({
							"aaData" : comparisonResult.percentageDiff,
							"aLengthMenu" : [ [ 5, 10, 20, 40, 80, -1 ], [ 5, 10, 20, 40, 80, "All" ] ],
							"bDestroy" : true,
							"bJQueryUI" : true,
							"sPaginationType" : "full_numbers",
							"aoColumns" : columns
						});
					});

				}
			});
			eLoggingCharts.populateAvailableCompareTests(testsSelect2);
			additionalTestHolder.append(testsSelect2);
			additionalTestHolder.append(deleteButton);
			additionalTestHolder.append(compareButton);
			additionalTestHolder.append(tableHolder);
			compareTests.append(additionalTestHolder);
		});

		chartBox.appendChild(testsSelect);
		chartBox.appendChild(drawButton);
		chartBox.appendChild(clearSelectionButton);
		chartBox.appendChild(additionalTestButton);
		chartBox.appendChild(compareTestsTestButton);

		var commentButton = $('<button type="button" class="button" id="trigger1">Add Comment</button>');
		var clicked = false;
		commentButton.click(function() {
			if (!clicked) {
				$('#panel1').slidePanel({
					triggerName : '#trigger1',
					position : 'fixed',
					panelTopPos : '0',
					ajax : false
				});
				clicked = true;
				commentButton.mousedown();
			}

			$('#panel1 #send').show();
			$('#panel1 #update').hide();

			$("#panel1 input, #panel1 textarea").each(function() {
				$(this).val("");
			});
		});

		chartBox.appendChild(commentButton);
		chartBox.appendChild($('<div class="spacer"></div>'));
		chartBox.appendChild(ignoreDateStampCheckBox);
		chartBox.appendChild(stackCheckBox);
		chartBox.appendChild(smoothCheckBox);
		chartBox.appendChild(barCheckBox);
		chartBox.appendChild(fixTimeStampsCheckBox);

		chartBox.appendChild(testDetails);
		chartBox.appendChild(eventsTableWrapper);
		chartBox.appendChild(additionalTests);
		chartBox.appendChild(compareTests);
		chartBox.appendChild(chartCanvas);
		chartBox.appendChild(overeviewCanvas);
		container.appendChild(chartBox);

		this.chartsCount++;
	},
	compareTests : function(tests, text) {
		return YUI3.Node.create('<option value="' + value + '">' + text + '</option>');
	},
	createSelectOption : function(value, text) {
		return YUI3.Node.create('<option value="' + value + '">' + text + '</option>');
	},

	populateAvailableCompareTests : function(testsSelect) {
		eLoggingCharts.eLoggingTests.sort().reverse();
		for (var i = 0; i < eLoggingCharts.eLoggingTests.length; i++) {
			var value = eLoggingCharts.eLoggingTests[i];
			testsSelect.append($('<option value="' + value + '">' + value + '</option>'));
		}
	},
	populateAvailableTests : function(testsSelect) {
		eLoggingCharts.eLoggingTests.sort().reverse();
		testsSelect.setData({
			id : this.chartsCount
		});

		testsSelect.appendChild(this.createSelectOption('', 'select test...'));
		var i = 0;
		for (i = 0; i < eLoggingCharts.eLoggingTests.length; i++) {
			var value = eLoggingCharts.eLoggingTests[i];
			testsSelect.appendChild(this.createSelectOption(value, value));
		}
	},
	createNewCanvas : function(id) {
		var canvas = $('#' + id);
		var newCanvas = $('<div id="' + id + '"></div>');
		newCanvas.css({
			class : 'chartCanvas'
		});// .width('700px');
		canvas.replaceWith(newCanvas);

	},

	prepareCompareTableData : function(selctedTestId1, selctedTestId2) {

		var result = {
			test1 : selctedTestId1,
			test2 : selctedTestId2,
			aggregationTypes : [],
			valuesDiff : [],
			percentageDiff : []
		};

		var selectedTest1 = eLoggingCharts.tests[selctedTestId1];
		var config1 = selectedTest1.config;
		var aggregationTypes1 = config1.aggregationTypes;
		var types1 = selectedTest1.eventTypes;

		var selectedTest2 = eLoggingCharts.tests[selctedTestId2];
		var config2 = selectedTest2.config;
		var aggregationTypes2 = config2.aggregationTypes;
		var types2 = selectedTest2.eventTypes;

		for (var i = 0; i < aggregationTypes1.length; i++) {
			if ($.inArray(aggregationTypes1[i], aggregationTypes2) != -1) {
				result.aggregationTypes.push(aggregationTypes1[i]);
			}
		}

		for (var i = 0; i < types1.length; i++) {
			var type = types1[i];
			if ($.inArray(type, types2) != -1) {
				var names1 = eLoggingCharts.tests[selctedTestId1]['type'][type].eventNames;
				var names2 = eLoggingCharts.tests[selctedTestId2]['type'][type].eventNames;
				for (var j = 0; j < names1.length; j++) {
					var name = names1[j];
					if ($.inArray(name, names2) != -1) {
						var eventData1 = eLoggingCharts.tests[selctedTestId1]['type'][type][name];
						var eventData2 = eLoggingCharts.tests[selctedTestId2]['type'][type][name];
						if (eventData1 && eventData2) {
							var statistics1 = eventData1.statistics;
							var statistics2 = eventData2.statistics;

							var calculateErrorRate = function(statistics) {
								if (statistics.CNT == 0) {
									return 100.00;
								} else {
									return (statistics.ERR / statistics.CNT * 100).toFixed(2);
								}
							}
							var errorRate1 = calculateErrorRate(statistics1);
							var errorRate2 = calculateErrorRate(statistics2);

							var timeDiff = [ type, name ];
							var percentageDiff = [ type, name ];

							for (var x = 0; x < result.aggregationTypes.length; x++) {
								var aggType = result.aggregationTypes[x];
								var stat1Val = statistics1[aggType];
								var statDiff = stat1Val - statistics2[aggType];
								timeDiff.push(statDiff);
								var percent = 0;
								if (statDiff != 0) {
									if (stat1Val != 0) {
										percent = (statDiff / stat1Val * 100.0).toFixed(2);
									} else {
										percent = 100;
									}
								}
								percentageDiff.push(percent);
							}
							var errorRateDiff = errorRate1 - errorRate2;
							timeDiff.push(errorRateDiff);

							var percent = 0;
							if (errorRateDiff != 0) {
								if (errorRate1 != 0) {
									percent = (errorRateDiff / errorRate1 * 100).toFixed(0)
								} else {
									percent = 100;
								}
							}

							percentageDiff.push(percent);

							result.valuesDiff.push(timeDiff);
							result.percentageDiff.push(percentageDiff)
						}
					}
				}
			}
		}
		return result;

	},

	prepareEventsTableData : function(selctedTestId) {

		var tableDataSet = eLoggingCharts.prepareStatisticsForTableRendering(selctedTestId);

	},
	prepareStatisticsForTableRendering : function(selctedTestId) {

		var selectedTest = eLoggingCharts.tests[selctedTestId];
		var config = selectedTest.config;
		var aggregationTypes = config.aggregationTypes;
		var types = selectedTest.eventTypes;

		var tableDataSet = [];
		for ( var idx in types) {
			var type = types[idx];
			var names = eLoggingCharts.tests[selctedTestId]['type'][type].eventNames;

			for (var j = 0; j < names.length; j++) {

				var eventData = eLoggingCharts.tests[selctedTestId]['type'][type][names[j]];
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
	downloadConfigAndStatistics : function(selctedTest, callback, callbackParams) {

		var testRoot = selctedTest.testRoot ? selctedTest.testRoot : eLoggingCharts.testsRootFolder + selctedTest.id;

		var ajaxSuccess = function(script, textStatus, jqXHR) {
			console.log('got: ' + this.url);
			var config = eLoggingCharts.tests[selctedTest.id].config;
			if (config.statisticsCSV) {

				var filePath = testRoot + "/statistics.csv";

				$.ajax({
					type : "GET",
					url : filePath,
					async : false,
					// 'Access-Control-Allow-Origin: *'
					// contentType: "text/csv",
					success : function(data) {
						console.log('got: ' + this.url);
						eLoggingCharts.tests[selctedTest.id].config.testRoot = testRoot;
						var stats = $.csv.toObjects(data);
						for (var i = 0; i < stats.length; i++) {
							eLoggingCharts.tests[selctedTest.id]['type'][stats[i].type][stats[i].name].statistics = stats[i];
						}
						callback(callbackParams);

					},
					error : function(data) {
						alert("Unable to load statistics.csv");
					}
				});
			} else {
				callback();
			}

		};

		var configURL = testRoot + '/config.js';

		var call = $.ajax({
			url : configURL,
			dataType : "script",
			success : ajaxSuccess
		});

		return call;

	},
	testSelectionChange : function(testsSelect, eventsTableWrapper) {

		var testId = testsSelect.get('value');

		eLoggingCharts.downloadConfigAndStatistics({
			id : testId
		}, function() {
			eLoggingCharts.configDownloadCallback(eLoggingCharts.tests[testId], eventsTableWrapper)
		});

	},
	configDownloadCallback : function(selectedTest, eventsTableWrapper) {
		var testId = selectedTest.config.testName;

		eventsTableWrapper.all('*').remove();
		var eventsTable = YUI3.Node.create('<table cellpadding="0" cellspacing="0" border="0" class="display ' + testId + '" id="chart_EventsTable_' + eLoggingCharts.chartsCount + '"></table>');
		eventsTableWrapper.appendChild(eventsTable);

		var prapareTestForRendering = function(tableData) {
			eLoggingCharts.drawEventsTable(eventsTable._node, tableData, testId);
		}

		var tableDataSet = eLoggingCharts.prepareStatisticsForTableRendering(testId);
		prapareTestForRendering(tableDataSet);
		var test = eLoggingCharts.tests[testId];
		var config = test.config;

		if (config.statisticsCSV) {
			var links = '<div class="spacer">';
			if (config.statisticsCSV) {
				var filePath = eLoggingCharts.testsRootFolder + testId + "/statistics.csv";
				links += '<a href="' + filePath + '">statistics.csv</a>';

			}
			links += '</div>'
			eventsTableWrapper.append(links);

		}

		eLoggingCharts.prepareValidationTable(selectedTest, eventsTableWrapper);
		eLoggingCharts.prepareTPSTable(selectedTest, eventsTableWrapper);
		eLoggingCharts.prepareErrorsTable(selectedTest, eventsTableWrapper);
		eLoggingCharts.prepareRatiosTable(selectedTest, eventsTableWrapper);

	},
	prepareTPSTable : function(selectedTest, eventsTableWrapper) {
		var config = selectedTest.config;
		var testComponentsWrappr = eventsTableWrapper;
		var filePath = config.testRoot + "/tps.csv";
		$.ajax({
			type : "GET",
			url : filePath,

			success : function(data) {
				var tps = $.csv.toObjects(data, {
					separator : ",",
					delimiter : "~"
				});

				testComponentsWrappr.append('<div class="spacer"> <a href="' + filePath + '">tps.csv</a></div>');
			},
			error : function(data) {
				console.log("Unable to load tps.csv");
			}
		});

		var filePath2 = config.testRoot + "/tps-full.csv";
		$.ajax({
			type : "GET",
			url : filePath2,

			success : function(data) {
				var tps = $.csv.toObjects(data, {
					separator : ",",
					delimiter : "~"
				});
				testComponentsWrappr.append(' <div class="spacer"><a href="' + filePath2 + '">tps-full.csv</a></div>');
			},
			error : function(data) {
				console.log("Unable to load tps-full.csv");
			}
		});

	},
	prepareValidationTable : function(selectedTest, eventsTableWrapper) {
		var config = selectedTest.config;
		var testComponentsWrappr = eventsTableWrapper;
		var filePath = config.testRoot + "/validation.csv";
		$.ajax({
			type : "GET",
			url : filePath,

			success : function(data) {
				var stats = $.csv.toObjects(data, {
					separator : ",",
					delimiter : "~"
				});
				testComponentsWrappr.append(' <a href="' + filePath + '">validation.csv</a>');
				/*
				 * var columns = eLoggingCharts.prepareErrorsColumnNames(); var
				 * errorData =[]; for ( var i = 0; i < stats.length; i++) { var
				 * errorSet = []; errorSet.push(stats[i].TYPE);
				 * errorSet.push(stats[i].NAME); errorSet.push(stats[i].ERRORS);
				 * errorSet.push(stats[i].ERROR_MESSAGE);
				 * errorData.push(errorSet); }
				 * 
				 * var eventsTable = $(errorsTable).dataTable({ "aaData" :
				 * errorData, "aLengthMenu" : [ [ 5, 10, 20, 40, 80, -1 ], [ 5,
				 * 10, 20, 40, 80, "All" ] ], "bDestroy" : true, "bJQueryUI" :
				 * true, "sPaginationType" : "full_numbers", "aoColumns" :
				 * columns }); var removeButton = $('<button type="button"
				 * class="button">Remove Table</button>');
				 * removeButton.click(function(){ errorsTableHolder.delete();
				 * }); errorsTableHolder.append(removeButton);
				 * testComponentsWrappr.append(errorsTableHolder);
				 */
			},
			error : function(data) {
				console.log("Unable to load validation.csv");
			}
		});

	},
	prepareErrorsTable : function(selectedTest, eventsTableWrapper) {
		var config = selectedTest.config;
		var testComponentsWrappr = eventsTableWrapper;
		if (config.errorsCSV) {

			var loadErrorsButton = $('<button type="button" class="button">Errors Table</button>');

			loadErrorsButton.click(function() {

				var errorsTable = $('<table cellpadding="0" cellspacing="0" border="0" class="display" id="chart_ErrorsTable_' + this.chartsCount + '"></table>');
				var errorsTableHolder = $('<div />');
				errorsTableHolder.append(errorsTable);
				var filePath = config.testRoot + "/errors.csv";
				$.ajax({
					type : "GET",
					url : filePath,
					// 'Access-Control-Allow-Origin: *'
					// contentType: "text/csv",
					success : function(data) {
						// var stats = $.csv.toObjects(data,{separator:"|"});
						var stats = $.csv.toObjects(data, {
							separator : "|",
							delimiter : "~"
						})

						var columns = eLoggingCharts.prepareErrorsColumnNames();
						var errorData = [];
						for (var i = 0; i < stats.length; i++) {
							var errorSet = [];
							errorSet.push(stats[i].TYPE);
							errorSet.push(stats[i].NAME);
							errorSet.push(stats[i].ERRORS);
							errorSet.push(stats[i].ERROR_MESSAGE);
							errorData.push(errorSet);
						}

						var eventsTable = $(errorsTable).dataTable({
							"aaData" : errorData,
							"aLengthMenu" : [ [ 5, 10, 20, 40, 80, -1 ], [ 5, 10, 20, 40, 80, "All" ] ],
							"bDestroy" : true,
							"bJQueryUI" : true,
							"sPaginationType" : "full_numbers",
							"aoColumns" : columns
						});
						var removeButton = $('<button type="button" class="button">Remove Table</button>');
						removeButton.click(function() {
							errorsTableHolder.remove();
						});
						errorsTableHolder.append(removeButton);
						testComponentsWrappr.append(errorsTableHolder);

					},
					error : function(data) {
						alert("Unable to load errors.csv");
					}
				});

			});

			testComponentsWrappr.append($('<div class="spacer">'))
			testComponentsWrappr.append(loadErrorsButton);
			var filePath = eLoggingCharts.testsRootFolder + config.testName + "/errors.csv";

			testComponentsWrappr.append(' <a href="' + filePath + '">errors.csv</a>');
			testComponentsWrappr.append($('<div class="spacer">'))

		}
	},
	prepareRatiosTable : function(selectedTest, eventsTableWrapper) {
		var config = selectedTest.config;
		var testComponentsWrappr = eventsTableWrapper;
		var filePath = eLoggingCharts.testsRootFolder + config.testName + "/ratios.csv";

		$.ajax({
			type : "GET",
			url : filePath,
			success : function(data) {
				var loadErrorsButton = $('<button type="button" class="button">Ratios Table</button>');
				loadErrorsButton.click(function() {

					var errorsTable = $('<table cellpadding="0" cellspacing="0" border="0" class="display" id="chart_RatiosTable_' + this.chartsCount + '"></table>');
					var errorsTableHolder = $('<div />');
					errorsTableHolder.append(errorsTable);

					$.ajax({
						type : "GET",
						url : filePath,

						success : function(data) {
							var stats = $.csv.toObjects(data, {
								separator : ","
							});

							var columns = eLoggingCharts.prepareRatiosColumnNames();
							var errorData = [];
							for (var i = 0; i < stats.length; i++) {
								var errorSet = [];
								errorSet.push(stats[i].name);
								errorSet.push(stats[i].fromType);
								errorSet.push(stats[i].fromName);
								errorSet.push(stats[i].toType);
								errorSet.push(stats[i].toName);
								errorSet.push(stats[i].fromCount);
								errorSet.push(stats[i].toCount);
								errorSet.push(stats[i].ratio);
								errorSet.push(stats[i].reverseRatio);
								errorData.push(errorSet);
							}

							var eventsTable = $(errorsTable).dataTable({
								"aaData" : errorData,
								"aLengthMenu" : [ [ 5, 10, 20, 40, 80, -1 ], [ 5, 10, 20, 40, 80, "All" ] ],
								"bDestroy" : true,
								"bJQueryUI" : true,
								"sPaginationType" : "full_numbers",
								"aoColumns" : columns
							});
							var removeButton = $('<button type="button" class="button">Remove Table</button>');
							removeButton.click(function() {
								errorsTableHolder.remove();
							});
							errorsTableHolder.append(removeButton);
							testComponentsWrappr.append(errorsTableHolder);
						},
						error : function(data) {
							alert("Unable to load ratios.csv");
						}
					});

				});
				testComponentsWrappr.append($('<div class="spacer">'))
				testComponentsWrappr.append(loadErrorsButton);

				testComponentsWrappr.append(' <a href="' + filePath + '">ratios.csv</a>');
				testComponentsWrappr.append($('<div class="spacer">'));
			},
			error : function(data) {
				console.log("Unable to load ratios.csv");
			}
		});

	},

	drawOverview : function(chartIdx, seriesValues, seriesNames) {
		$.jqplot(chartIdx, seriesValues, {
			title : '',
			// animate : true,
			series : seriesNames,
			legend : {
				show : true,
				renderer : $.jqplot.EnhancedLegendRenderer,
				placement : 'outside',
				location : 's'
			},
			seriesDefaults : {
				showMarker : true,
				pointLabels : {
					show : true
				}
			},
			cursor : {
				show : true,
				zoom : true
			},
			highlighter : {
				sizeAdjust : 10,
				tooltipLocation : 'n',
				tooltipAxes : 'yx',
				bringSeriesToFront : true,
				// useAxesFormatters: false,
				formatString : '<div class="jqplot-highlighter"><span></span>%sth: <strong>%s</strong></div>',
				tooltipContentEditor : function(str, seriesIndex, pointIndex, plot) {
					return str + '\n' + plot.series[seriesIndex].label;// .replace(/\|/g,
																		// '<br>');
				},
			},
			axes : {
				yaxis : {
					label: '%'
				}
			}
		});
	},
	drawChart : function(chartIdx, seriesValues, seriesNames) {
		var renderOptions = {
			title : '',
			// animate : true,
			stackSeries : eLoggingCharts.stack,
			legend : {
				show : true,
				renderer : $.jqplot.EnhancedLegendRenderer,
				placement : 'outside',
				location : 's'
			},
			seriesDefaults : {
				// renderer:$.jqplot.BezierCurveRenderer,

				showMarker : false,
				// fill
				fill : eLoggingCharts.stack,
				fillAndStroke : eLoggingCharts.stack

			},
			series : seriesNames,
			axes : {
				xaxis : {
					renderer : $.jqplot.DateAxisRenderer,
					// renderer :$.jqplot.LogAxisRenderer,
					rendererOptions : {
						tickInset : 0
					},
					tickRenderer : $.jqplot.CanvasAxisTickRenderer,
					tickOptions : {
						angle : -30,
						formatString : eLoggingCharts.ignoreDateStamp ? '%T' : '%d%b %T'
					}
				// numberTicks : 15
				},
				yaxis : {
					// min:457,
					// renderer: $.jqplot.LogAxisRenderer,
					tickOptions : {
					// formatString: '$%.2f'
					}
				}
			},
			highlighter : {
				sizeAdjust : 10,
				tooltipLocation : 'n',
				bringSeriesToFront : true,
				// useAxesFormatters: false,
				formatString : '<div class="jqplot-highlighter"><span></span>%s: <strong>%s</strong></div>',
				tooltipContentEditor : function(str, seriesIndex, pointIndex, plot) {
					return str + '\n' + plot.series[seriesIndex].label;// .replace(/\|/g,
																		// '<br>');
				},
			},
			cursor : {
				show : true,
				zoom : true
			}
		};
		var seriesDefaults = renderOptions.seriesDefaults;

		if (eLoggingCharts.bar) {
			seriesDefaults.renderer = $.jqplot.BarRenderer;
			seriesDefaults.rendererOptions = {
				barMargin : 25
			};
			seriesDefaults.pointLabels = {
				show : true,
				stackedValue : true
			};
		}

		// seriesDefaults.renderer = jQuery.jqplot.PieRenderer;

		eLoggingCharts.plots[chartIdx] = $.jqplot('chart_canvas_' + chartIdx, seriesValues, renderOptions);

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
				series.push([ events.AGG[i].time, events.AGG[i].data[property] ]);
			}
		}
		return events.series[property];
	},

	getOverviewSeriesStatistics : function(overview) {

		var series = [];
		var test = overview.test;
		var event = overview.event;
		// events.series['overview'] = series;
		test.config.aggregationTypes.forEach(function(aggregation) {

			if (aggregation.endsWith('th')) {

				var x = parseFloat(test['type'][event.type][event.name].statistics[aggregation]);
				var y = parseFloat(aggregation.replace('th', ''));

				series.push([ x, y ]);
			}
		});

		return series;
	},
	getSeriesFromCSV : function(events, property, test) {
		if (!events.series) {
			events.series = {};
		}

		var series = [];
		events.series[property] = series;
		for (var i = 0; i < events.csvData.length; i++) {
			// series.push([ events.csvData[i].Time,
			// parseFloat(events.csvData[i][property]) ]);
			var dateTimeStamp = eLoggingCharts.ignoreDateStamp ? events.csvData[i].Time : events.csvData[i].Date + " " + events.csvData[i].Time;
			series.push([ dateTimeStamp, parseFloat(events.csvData[i][property]) ]);
		}

		return events.series[property];
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

	redrawChart_buildSelections : function() {

		var result = {
			selections : [],
			overviews : [],
			fileNames : []
		}

		for ( var x in eLoggingCharts.selectedCharts) {
			var selectedChart = eLoggingCharts.selectedCharts[x];
			if (selectedChart) {
				var testName = selectedChart.testName;
				var selectedEvent = eLoggingCharts.tests[testName]['type'][selectedChart.eventType][selectedChart.eventName];
				var chartType = selectedChart.chartType;

				var select = {
					test : eLoggingCharts.tests[testName],
					testName : testName,
					event : {
						type : selectedChart.eventType,
						name : selectedChart.eventName,
						chartType : chartType
					},
					eventData : selectedEvent,
					selection : selectedChart,

				};

				if ('overview' == chartType) {
					result.overviews.push(select);

				} else {
					var extension = ".js";
					if ("CSV" == eLoggingCharts.tests[testName].config.conversionType) {
						extension = ".csv";
					}
					var fileName = eLoggingCharts.tests[testName].config.testRoot + '/' + selectedEvent.fileName + '_AGG' + extension;
					select.file = fileName;

					result.selections.push(select);
					result.fileNames.push(fileName);
				}
			}
		}
		return result;
	},

	redrawChart_downloadFiles : function(picked) {
		var tasks = new Array();
		picked.selections.forEach(function(sel) {
			if (sel.test.config.conversionType == "CSV") {
				var task = $.ajax({
					type : "GET",
					url : sel.file,
					event : sel.event,
					selection : sel,
					testName : sel.testName
				});

				task.done(function(data) {
					console.log('got: ' + this.url);
					var csv = $.csv.toObjects(data);
					eLoggingCharts.tests[this.testName]['type'][this.event.type][this.event.name].csvData = csv;

				});

				tasks.push(task);
			} else {
				// legacy storage .js
				tasks.push($.getScript(sel.file));
			}

		})
		return tasks;

	},
	redrawChart_createNewCanvases : function(id) {

		eLoggingCharts.createNewCanvas('chart_canvas_' + id + '_overview');
		eLoggingCharts.createNewCanvas('chart_canvas_' + id);
	},

	redrawChart_fromTableSelection : function(id) {

		eLoggingCharts.redrawChart_createNewCanvases(id);

		var picked = eLoggingCharts.redrawChart_buildSelections();

		var chartSeries = [];
		var seriesNames = [];
		// render overviews
		var id_verview = 'chart_canvas_' + id + '_overview';
		$('#' + id_verview).width(800).height(400).css({
			margin : 'auto'
		});

		picked.overviews.forEach(function(overview) {
			chartSeries.push(eLoggingCharts.getOverviewSeriesStatistics(overview));
			var label = overview.selection.eventType + ' | ' + overview.selection.eventName + ' | ' + overview.testName;
			seriesNames.push({
				rendererOptions : {
					smooth : eLoggingCharts.smooth
				},
				label : label
			});

		})
		if (chartSeries.length > 0) {
			eLoggingCharts.drawOverview(id_verview, chartSeries, seriesNames);
		}
		// render charts/lines
		var downloadTasks = eLoggingCharts.redrawChart_downloadFiles(picked);
		$.when.apply($, downloadTasks).then(function() {
			console.log('got all files');
			var chartSeries = [];
			var seriesNames = [];
			var i = 0;

			for (i = 0; i < picked.selections.length; i++) {
				var data = picked.selections[i];
				var chartType = data.selection.chartType;
				var testName = data.testName;
				var conversionType = eLoggingCharts.tests[testName].config.conversionType;
				if ('CSV' == conversionType) {
					eLoggingCharts.tests[testName].config.getSeriesFunc = eLoggingCharts.getSeriesFromCSV;

				} else if ('Array' == conversionType) {
					eLoggingCharts.tests[testName].config.getSeriesFunc = eLoggingCharts.getSeriesFromArray;
					var aggTypes = eLoggingCharts.tests[testName].config.aggregationTypes;
					eLoggingCharts.tests[testName].config.aggregationTypesIdx = {};
					for (var j = 0; j < aggTypes.length; j++) {
						eLoggingCharts.tests[testName].config.aggregationTypesIdx[aggTypes[j]] = j;
					}
				} else if ('JSON' == conversionType) {
					eLoggingCharts.tests[testName].config.getSeriesFunc = eLoggingCharts.getSeriesFromJSON;
				}

				chartSeries.push(eLoggingCharts.tests[testName].config.getSeriesFunc(data.eventData, chartType, data.test));
				seriesNames.push({
					rendererOptions : {
						smooth : eLoggingCharts.smooth
					},
					label : data.selection.eventType + ' | ' + data.selection.eventName + ' | ' + eLoggingCharts.getColumnName(chartType) + ' | ' + data.selection.testName
				});
			}
			if (picked.selections.length > 0) {
				if (eLoggingCharts.fixTimeStamps) {
					eLoggingCharts.fixSeriesTimeStamps(chartSeries);
				}
				eLoggingCharts.createNewCanvas(id);
				eLoggingCharts.drawChart(id, chartSeries, seriesNames);
			}
		});

	},
	fixSeriesTimeStamps : function(chartSeries) {

		var timestamps = {};
		for (var i = 0; i < chartSeries.length; i++) {
			for (var j = 0; j < chartSeries[i].length; j++) {
				timestamps[chartSeries[i][j][0]] = 0;
			}
		}
		var timestampsArr = [];

		for (timestamp in timestamps) {
			timestampsArr.push(timestamp);
		}
		timestampsArr.sort();

		for (var x = 0; x < timestampsArr.length; x++) {
			timestamp = timestampsArr[x];
			for (i = 0; i < chartSeries.length; i++) {
				var serie = chartSeries[i];
				var found = false;
				for (var j = 0; j < serie.length; j++) {
					var curTimestamp = serie[j][0];
					if (timestamp == curTimestamp) {
						found = true;
						break;
					}
					if (timestamp < curTimestamp) {
						serie.splice(j, 0, [ timestamp, 0 ]);
						found = true;
						break;
					}

				}
				if (!found) {
					serie.push([ timestamp, 0 ]);
				}
			}

		}

	},
	prepareErrorsColumnNames : function(aggregationTypes) {

		var columns = [ {
			"sTitle" : "Type"
		}, {
			"sTitle" : "Name"
		}, eLoggingCharts.centerOption("Errors"), {
			"sTitle" : "Error Message"
		}

		];

		return columns;
	},
	prepareRatiosColumnNames : function(aggregationTypes) {

		var columns = [ {
			"sTitle" : "Name"
		}, {
			"sTitle" : "From Type"
		}, {
			"sTitle" : "From Name"
		}, {
			"sTitle" : "To Type"
		}, {
			"sTitle" : "To Name"
		}, eLoggingCharts.centerOption("from Count"), eLoggingCharts.centerOption("to Count"), eLoggingCharts.centerOption("Ratio"), eLoggingCharts.centerOption("Reverse Ratio") ];

		return columns;
	},
	centerOption : function(name) {
		return {
			"sTitle" : name,
			"sClass" : "center"
		};
	},

	prepareColumnNames : function(aggregationTypes) {

		var columns = [ {
			"sTitle" : "Type"
		}, {
			"sTitle" : "Name"
		} ];

		var i = 2;

		for ( var aIdx in aggregationTypes) {
			var columnName = aggregationTypes[aIdx];
			columns.push(eLoggingCharts.centerOption(eLoggingCharts.getColumnName(columnName)));
			$('body').data()[columnName] = i++;
		}

		columns.push(eLoggingCharts.centerOption('Error rate %'));
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
	drawEventsTable : function(tableHolder, aDataSet, selctedTestId) {

		var selectedTest = eLoggingCharts.tests[selctedTestId];
		var config = selectedTest.config;
		var aggregationTypes = config.aggregationTypes;

		var columns = eLoggingCharts.prepareColumnNames(aggregationTypes);
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
			var type = $(nTds[0]).text();
			var name = $(nTds[1]).text();

			var clickOptions = function(type, name, chartType) {
				return {
					'eventType' : type,
					'eventName' : name,
					'chartType' : chartType,
					'testName' : selctedTestId
				};
			}

			var i = 2;
			for ( var aIdx in aggregationTypes) {
				$(nTds[i++]).click(clickOptions(type, name, aggregationTypes[aIdx]), eLoggingCharts.eventSelected);
			}

			$(nTds[1]).click(clickOptions(type, name, 'overview'), eLoggingCharts.eventSelected_Overview);

		});
	},
	eventSelected_Overview : function(event) {
		if (!eLoggingCharts.selectedCharts) {
			eLoggingCharts.selectedCharts = {};
		}
		var testName = event.data.testName;
		var type = event.data.eventType;
		var name = event.data.eventName;
		var chart = event.data.chartType;
		var key = testName + '_' + type + '_' + name + '_' + chart;
		if (eLoggingCharts.selectedCharts[key]) {
			$(event.target).removeClass('selectedEvent');
			eLoggingCharts.selectedCharts[key] = undefined;
		} else {
			$(event.target).addClass('selectedEvent');
			eLoggingCharts.selectedCharts[key] = {
				'testName' : testName,
				eventType : type,
				eventName : name,
				chartType : chart
			};
		}
	},
	eventSelected : function(event) {
		if (!eLoggingCharts.selectedCharts) {
			eLoggingCharts.selectedCharts = {};
		}
		var testName = event.data.testName;
		var type = event.data.eventType;
		var name = event.data.eventName;
		var chart = event.data.chartType;
		var key = testName + '_' + type + '_' + name + '_' + chart;
		if (eLoggingCharts.selectedCharts[key]) {
			$(event.target).removeClass('selectedEvent');
			eLoggingCharts.selectedCharts[key] = undefined;
		} else {
			$(event.target).addClass('selectedEvent');
			eLoggingCharts.selectedCharts[key] = {
				'testName' : testName,
				eventType : type,
				eventName : name,
				chartType : chart
			};
		}
	},

};
