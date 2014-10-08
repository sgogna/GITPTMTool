DIR=$(dirname $(readlink -f $0))
JDK_HOME=`$DIR/../config/getProperty.sh tools JDK_HOME`
"$JDK_HOME"bin/java -classpath lib/*:configs -Dconfig.tag=$TAG pl.com.csvcollector.CollectorStartupForBuild $1
