#!/bin/bash
FOLDER=$1
DIR=$(dirname $(readlink -f $0))
GCVIEWER=$DIR"/../gcviewer/"
JDK_HOME=`$DIR/../config/get-jdk-home.sh`

echo "$JDK_HOME"
echo "$GCLOG_REPORT"
echo "$GCVIEWER"

for dir in $FOLDER/*; do
	rm $dir/report.csv
	for f in $dir/*backup*.log.gz; do 
		filename=$f
		
		gunzip -f $filename
		
		logName=$(echo $filename | sed 's/\.[^.]*$//')
		reportName=$(echo $logName | sed 's/\.[^.]*$//')".report.txt"
		
		if ! [ -f $reportName ]
		then
			reportName=$(echo $logName | sed 's/\.[^.]*$//')".log.report.txt"
		fi

		#"$JDK_HOME"bin/java -jar "$GCVIEWER"gcviewer-1.34-SNAPSHOT.jar $logName $reportName
		
		$DIR/generateReport.sh $logName;

		gzip $(echo $filename | sed 's/\.[^.]*$//')
		
	done
done
