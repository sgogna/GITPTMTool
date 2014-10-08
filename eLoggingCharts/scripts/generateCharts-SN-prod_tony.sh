./mkdirsForJs.sh

T1_serv=$5
T1_instance=$6

T2_serv=$7
T2_instance=$8

if [ "$(T1_serv)" == '' ]; then
        T1_serv='sswhli454'
fi

if [ "$(T1_instance)" == '' ]; then
        T1_instance='4'
fi

if [ "$(T2_serv)" == '' ]; then
        T2_serv='sswhli474'
fi

if [ "$(T2_instance)" == '' ]; then
        T2_instance='4'
fi

T1=$T1_serv$T1_instance
T2=$T2_serv$T2_instance

AIRLINE="SN"
T1_LOG_PATTERN="/tier1_nas1/logs/prod/SN/sswhlp1201/inst3/eLoggingWeb_SN."
T2_LOG_PATTERN="/tier2_nas1/logs/prod/SN/sswhlp1223/inst1/eLoggingServer_SN."

java -Xmx500M -DsrcTestName=$AIRLINE_$1_$2_"T1" -DsrcFile=$T1_LOG_PATTERN$1".log" -Dinterval=60000 -DstartDate="$3" -DendDate="$4" -DaggregationTypes="CNT;AVG;ST_DEV;PERCENTILE_50;PERCENTILE_90;MAX;ERR" -DexcludedEventTypes="" -DexcludedEventNames="" -cp eLoggingParser-1.0.jar com.eb2.elogging.ChartsGenerator
java -Xmx750M -DsrcTestName=$AIRLINE_$1_$2_"T2" -DsrcFile=$T2_LOG_PATTERN$1".log" -Dinterval=60000 -DstartDate="$3" -DendDate="$4" -DaggregationTypes="CNT;AVG;ST_DEV;PERCENTILE_50;PERCENTILE_90;MAX;ERR" -DexcludedEventTypes="" -DexcludedEventNames="" -cp eLoggingParser-1.0.jar com.eb2.elogging.ChartsGenerator

OUT_ARCH=results-$AIRLINE/$AIRLINE_$1_$2.tgz

tar -czf $OUT_ARCH js/eLogging/tests
./rmdirsForJs.sh
echo | mutt -a $OUT_ARCH -s "$OUT_ARCH" -- bejoy.nellissery.ctr@sabre.com

