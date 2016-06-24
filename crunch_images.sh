#!/bin/bash
pushd www/assets/photos
for file in *.jpg; do
    if [[ $file != small* ]];
    then
        echo "Making small-$file"
        convert $file -strip -interlace Plane -gaussian-blur 0.03 -quality 80 -resize 900 small-$file
    fi
done
popd
pushd www/assets/photos/crops
for file in *.jpg; do
    if [[ $file != small* ]];
    then
        echo "Making small-$file"
        convert $file -strip -interlace Plane -gaussian-blur 0.03 -quality 80 -resize 900 small-$file
    fi
done
popd
