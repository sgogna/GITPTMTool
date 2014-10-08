DIR=$(dirname $(readlink -f $0))
ROOT="$DIR/../../../"
JDK_HOME=`$ROOT/config/get-jdk-home.sh`


LIBS=`ls $ROOT/shadowtail/lib/*.jar | xargs | tr " " ":"`
LIBS="$LIBS:"`ls $ROOT/csvcollector/lib/*.jar | xargs | tr " " ":"`
LIBS="$LIBS:$ROOT/csvcollector/"

#echo $LIBS | tr ":" "\n"
"$JDK_HOME"bin/java -cp "$LIBS" com.csvcollector.gcviewer.AppendStartup $*

for i in $*; do 
	echo "Appended: $i"
done
