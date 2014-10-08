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

T1_LOG_PATTERN="/nas/logs/int/SSW2010/sswhli454/inst6/eLoggingWeb_SSW2010."
T2_LOG_PATTERN="/nas/logs/int/SSW2010/sswhli474/inst6/eLoggingServer."

AGG_TYPES="CNT;AVG;ST_DEV;PERCENTILE_10;PERCENTILE_20;PERCENTILE_30;PERCENTILE_40;PERCENTILE_50;PERCENTILE_60;PERCENTILE_70;PERCENTILE_80;PERCENTILE_90;PERCENTILE_99;MAX;ERR"

java -Xmx1000M -DsrcTestName=V12_$1_$2_"T1" -DsrcFile=$T1_LOG_PATTERN$1".log" -Dinterval=60000 -DstartDate="$3" -DendDate="$4" -DaggregationTypes="$AGG_TYPES" -DexcludedEventTypes="" -DexcludedEventNames="" -cp eLoggingParser-1.0.jar com.eb2.elogging.ChartsGenerator
java -Xmx1000M -DsrcTestName=V12_$1_$2_"T2" -DsrcFile=$T2_LOG_PATTERN$1".log" -Dinterval=60000 -DstartDate="$3" -DendDate="$4" -DaggregationTypes="$AGG_TYPES" -DexcludedEventTypes=".*CMD.*" -DexcludedEventNames="" -cp eLoggingParser-1.0.jar com.eb2.elogging.ChartsGenerator

AIRLINE=V12

OUT_ARCH=results-$AIRLINE/$1_$2_$T1_serv$T1_T2.tgz

tar -czf $OUT_ARCH js/eLogging/tests
./rmdirsForJs.sh
echo | mutt -a $OUT_ARCH -s "$OUT_ARCH" -- 
"sebastian.puzon@sabre.com;jakub.wozniakowski@sabre.com;jakub.balamut@sabre.com;Bejoy.Nellissery.ctr@sabre.com"
