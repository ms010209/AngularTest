updateScaleDisplay : function(){
  const scaleText = document.getElementById('scaleText');
  const scaleBar = document.getElementById('scaleBar');

  if(!scaleText || !scaleBar) return;

  const scene = $scope.menu2.obj.scene;
  const camera = scene.camera;
  const canvas = scene.canvas;

  const center = new Cesium.Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2);
  const centerPosition = camera.pickEllipsoid(center, scene.globe.ellipsoid);

  if(!centerPosition){
    scaleText.innerText = 'N/A';
    scaleBar.style.width = '0px';
    return;
  }

  const right = new Cesium.Cartesian2(center.x + 100, center.y);
  const rightPosition = camera.pickEllipsoid(right, scene.globe.ellipsoid);

  if(!rightPosition) {
    scaleText.innerText = 'N/A';
    scaleBar.style.width = '0px';
  }

  const geodesic = new Cesium.EllipsoidGeodesic();
  geodesic.setEndPoints(
    Cesium.Ellipsoid.WGS84.cartesianToCartographic(centerPosition),
    Cesium.Ellipsoid.WGS84.cartesianToCartographic(rightPosition)
  )

  const distance = geodesic.surfaceDistance;

  const { closestDistance, barWidth } = $scope.menu2.func.calculateClosestScale(distance);

  $scope.menu2.obj.scaleText = $scope.menu2.func.formatDistance(closestDistance);
  scaleBar.style.width = barWidth + 'px';

  $scope.$applyAsync(); // 변경 감지
},
calculateClosestScale : function(distance){
  for (let i = 0; i < $scope.menu2.obj.predefinedDistances.length; i++) {
    const scale = $scope.menu2.obj.predefinedDistances[i];
    const nextScale = $scope.menu2.obj.predefinedDistances[i + 1] || scale * 2; // 다음 축척 값

    const ratio = distance / scale;

    // 화면에서 현재 축척 값에 대한 바 너비 계산
    const scaleWidth = $scope.menu2.obj.max_scalebar_width / ratio;

    if (scaleWidth >= $scope.menu2.obj.min_scalebar_width && scaleWidth <= $scope.menu2.obj.max_scalebar_width) {
      // 현재 축척이 적절하면 반환
      return { closestDistance: scale, barWidth: Math.round(scaleWidth) };
    } else if (scaleWidth > $scope.menu2.obj.max_scalebar_width && distance <= nextScale) {
      // 현재 너비가 100px 이상이고 다음 축척으로 넘어가야 할 때
      return { closestDistance: nextScale, barWidth: $scope.menu2.obj.min_scalebar_width };
    }
  }

  return { closestDistance: $scope.menu2.obj.predefinedDistances[0], barWidth: $scope.menu2.obj.min_scalebar_width };
},
formatDistance : function(distance){
  if (distance < 1000) {
    return distance + 'm'; // 1km 미만은 미터로 표시
  } else {
    return (distance / 1000).toFixed(0) + 'km'; // 1km 이상은 km로 표시
  }
},
