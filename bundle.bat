pushd %~dp0

cd mutraction
call npm run bundle
cd ..

cd mutraction-react
call npm run bundle
cd ..

popd