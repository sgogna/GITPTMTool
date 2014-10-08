file=$1
output=$file".report.csv"
JDK_HOME=`$DIR/../config/getProperty.sh tools JDK_HOME`
$JDK_HOME/bin/java -classpath lib/*: pl.com.rupert.shadowtail.ShadowtailLogAggregator $file > $output
cat $output;
