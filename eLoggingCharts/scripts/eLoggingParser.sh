java -Xmx520M -DsrcTestName=$1 -DsrcFile=$2 -Dinterval=$3 -DexcludedEventTypes=$4 -DexcludedEventNames=$5 -cp eLoggingParser-1.0.jar com.eb2.elogging.ChartsGenerator
tar -czf js.tgz js