pushd %~dp0

del /S /Q .\mutraction-react\node_modules\mutraction\
del /S /Q .\example\node_modules\mutraction\
del /S /Q .\example\node_modules\mutraction-react\

xcopy .\mutraction\dist\ .\mutraction-react\node_modules\mutraction\ /S /Q /Y
copy .\mutraction\package.json .\mutraction-react\node_modules\mutraction\

xcopy .\mutraction\dist\ .\example\node_modules\mutraction\ /S /Q /Y
copy .\mutraction\package.json .\example\node_modules\mutraction\

xcopy .\mutraction-react\dist\ .\example\node_modules\mutraction-react\ /S /Q /Y
copy .\mutraction-react\package.json .\example\node_modules\mutraction-react\

popd