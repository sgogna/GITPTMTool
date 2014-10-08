./mkdirsForJs.sh

AIRLINE=B6
T1_LOG_PATTERN="/ssw2/logs/prod/B6/sswhlp201/inst1/eLoggingWeb."
T2_LOG_PATTERN="/tier2_nas1/logs/prod/B6/sswhlp230/inst1/eLoggingServer."

AGG_TYPES="CNT;AVG;ST_DEV;PERCENTILE_10;PERCENTILE_20;PERCENTILE_30;PERCENTILE_40;PERCENTILE_50;PERCENTILE_60;PERCENTILE_70;PERCENTILE_80;PERCENTILE_90;PERCENTILE_99;MAX;ERR"
XAGG_TYPES="CNT;AVG;ST_DEV;PERCENTILE_50;PERCENTILE_75;PERCENTILE_90;MAX;ERR"


java -Xmx2000M -DsrcTestName=$1_$2_"T1" -DsrcFile=$T1_LOG_PATTERN$1".log.gz" -DstatisticsCSV=true -Dinterval=60000 -DstartDate="$3" -DendDate="$4" -DaggregationTypes="$AGG_TYPES" -DexcludedEventTypes="" -DexcludedEventNames=".*jsessionid.*" -cp eLoggingParser-1.0.jar com.eb2.elogging.ChartsGenerator
java -Xmx2000M -DsrcTestName=$1_$2_"T2" -DsrcFile=$T2_LOG_PATTERN$1".log.gz" -DstatisticsCSV=true -Dinterval=60000 -DstartDate="$3" -DendDate="$4" -DaggregationTypes="$AGG_TYPES" -DexcludedEventTypes=".*CMD.*" -DexcludedEventNames="" -cp eLoggingParser-1.0.jar com.eb2.elogging.ChartsGenerator

OUT_ARCH=results-$AIRLINE-new/$AIRLINE_$1_$2.tgz

tar -czf $OUT_ARCH js/eLogging/tests
./mkdirsForJs.sh
Xecho | Xmutt -a $OUT_ARCH -s "$OUT_ARCH" -- "sebastian.puzon@sabre.com;Bejoy.Nellissery.ctr@sabre.com;nikod$
