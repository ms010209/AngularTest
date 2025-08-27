import { Component, AfterViewInit, NgZone, OnDestroy } from '@angular/core';
import {
  Viewer,
  Cartesian3,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Cartographic,
  Math as CesiumMath,
  Cartesian2,
  EllipsoidGeodesic,
  Ion,
  Color,
  VerticalOrigin,
} from 'cesium';
import { environment } from '../environments/environment';
import * as Cesium from 'cesium';

(window as any).CESIUM_BASE_URL = environment.CESIUM_BASE_URL;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit, OnDestroy {
  viewer!: Viewer;

  latDMS = '0º';
  lonDMS = '0º';
  altitudeKm = 0;
  currentDateTime = '';
  scaleText: string = 'N/A';
  scaleBarWidth: string = '0px';

  // 전체 거리 텍스트
  totalDistanceText = '0 m';

  private handler!: ScreenSpaceEventHandler;

  // 측정 핸들러는 한 번에 하나만 유지
  private measureHandler: ScreenSpaceEventHandler | null = null;

  // 측정 그룹 카운터: 새 측정 시작 시 1씩 증가
  private groupIdCounter = 1;

  private intervalId: any;
  private scaleUpdateTimer: any;

  predefinedDistances = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
  minScaleBarWidth = 60;
  maxScaleBarWidth = 100;

  constructor(private readonly ngZone: NgZone) {}

  ngAfterViewInit(): void {
    Ion.defaultAccessToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlZmE1ZGMyMS0zNTMyLTRlODYtYmEyNS1hZjU4MWQ1MmVhNzMiLCJpZCI6MzM1MDYxLCJpYXQiOjE3NTYxMDU5NjZ9.5k_U5CUfTCyrJq6Q-VumGzr4g07u-QPweDEuk07MMJU";

    Cesium.createWorldTerrainAsync().then(terrain => {
      this.viewer = new Viewer('cesiumContainer', {
        terrainProvider: terrain,
        animation: false,
        timeline: false,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        sceneModePicker: false,
        selectionIndicator: false,
        navigationHelpButton: false,
        fullscreenButton: false,
        vrButton: false,
      });

      this.viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(127.38019058822, 36.359558821549, 3000),
        duration: 3,
      });

      this.handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);
      this.handler.setInputAction((movement: { endPosition: Cartesian2 }) => {
        const cartesian = this.viewer.camera.pickEllipsoid(movement.endPosition);
        if (cartesian) {
          const cartographic = Cartographic.fromCartesian(cartesian);
          const lat = CesiumMath.toDegrees(cartographic.latitude);
          const lon = CesiumMath.toDegrees(cartographic.longitude);
          this.latDMS = this.toDMS(lat);
          this.lonDMS = this.toDMS(lon);
        }
      }, ScreenSpaceEventType.MOUSE_MOVE);

      this.viewer.camera.changed.addEventListener(() => {
        clearTimeout(this.scaleUpdateTimer);
        this.scaleUpdateTimer = setTimeout(() => {
          this.ngZone.run(() => {
            const cameraPosition = this.viewer.camera.positionCartographic;
            this.altitudeKm = +(cameraPosition.height / 1000).toFixed(2);
            this.updateScaleDisplay();
          });
        }, 10); // 축척도 갱신 속도
      });

      const cameraPosition = this.viewer.camera.positionCartographic;
      this.altitudeKm = +(cameraPosition.height / 1000).toFixed(2);
      this.updateScaleDisplay();

      this.updateDateTime();
      this.intervalId = setInterval(() => this.updateDateTime(), 100); // 고도 갱신
    });
  }

  // 거리 측정 시작: 새 그룹으로 새로 시작
  startDistanceMeasurement(): void {
    // 이전 측정 핸들러가 있으면 반드시 종료
    if (this.measureHandler) {
      this.measureHandler.destroy();
      this.measureHandler = null;
    }

    // 새 그룹 아이디
    const groupId = `measureGroup-${this.groupIdCounter++}`;
    const localPositions: Cartesian3[] = [];
    const localDistanceLabels: Cesium.Entity[] = [];
    const localPolylines: Cesium.Entity[] = [];

    this.measureHandler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);

    // 좌클릭 마커 찍기
    this.measureHandler.setInputAction((click: { position: Cartesian2 }) => {
      const position = this.viewer.scene.pickPosition(click.position);
      if (!position) return;

      localPositions.push(position);

      // 마커 추가 (groupId+index로 id 고유 지정)
      this.viewer.entities.add({
        id: `${groupId}-marker-${localPositions.length}`,
        position,
        point: {
          pixelSize: 10,
          color: Color.BLUE,
        },
        label: {
          text: `${localPositions.length}`,
          font: '16px sans-serif',
          verticalOrigin: VerticalOrigin.BOTTOM,
          pixelOffset: new Cartesian2(0, -10),
          fillColor: Color.WHITE,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
        }
      });

      // 기존 거리 라벨 및 선 추가
      // 이전 그룹과 섞이지 않게 새로 그리기 위해, 기존 라벨/선은 그룹별로 따로 관리 필요

      // 마커 간 거리 라벨 생성
      for (let i = localDistanceLabels.length; i < localPositions.length - 1; i++) {
        const dist = Cartesian3.distance(localPositions[i], localPositions[i + 1]);
        const midPoint = Cartesian3.midpoint(localPositions[i], localPositions[i + 1], new Cartesian3());

        const labelEntity = this.viewer.entities.add({
          id: `${groupId}-dist-label-${i + 1}`,
          position: midPoint,
          label: {
            text: (dist / 1000).toFixed(2) + ' km',
            font: '16px sans-serif',
            fillColor: Color.WHITE,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 2,
            verticalOrigin: VerticalOrigin.BOTTOM,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          }
        });
        localDistanceLabels.push(labelEntity);

        // 선 추가
        const polyline = this.viewer.entities.add({
          id: `${groupId}-polyline-${i + 1}`,
          polyline: {
            positions: [localPositions[i], localPositions[i + 1]],
            width: 2,
            material: Color.WHITE,
          }
        });
        localPolylines.push(polyline);
      }

      // 총 거리 계산 및 표시
      const total = this.computeTotalDistance(localPositions);
      this.totalDistanceText = this.formatDistance(total);

    }, ScreenSpaceEventType.LEFT_CLICK);

    // 마우스 움직임 이벤트 : 임시 선 + 거리 라벨
    this.measureHandler.setInputAction((movement: { endPosition: Cartesian2 }) => {
      if (localPositions.length === 0) return;

      const tempPosition = this.viewer.scene.pickPosition(movement.endPosition);
      if (!tempPosition) return;

      // 임시 선 삭제 후 새로 생성
      if (this.viewer.entities.getById(`${groupId}-tempLine`)) {
        this.viewer.entities.removeById(`${groupId}-tempLine`);
      }
      this.viewer.entities.add({
        id: `${groupId}-tempLine`,
        polyline: {
          positions: [localPositions[localPositions.length - 1], tempPosition],
          width: 2,
          material: Color.BLUE,
        }
      });

      // 임시 거리 라벨 삭제 후 새로 생성
      if (this.viewer.entities.getById(`${groupId}-tempLabel`)) {
        this.viewer.entities.removeById(`${groupId}-tempLabel`);
      }

      const dist = Cartesian3.distance(localPositions[localPositions.length - 1], tempPosition);
      const midPoint = Cartesian3.midpoint(localPositions[localPositions.length - 1], tempPosition, new Cartesian3());

      this.viewer.entities.add({
        id: `${groupId}-tempLabel`,
        position: midPoint,
        label: {
          text: (dist / 1000).toFixed(2) + ' km',
          font: '16px sans-serif',
          fillColor: Color.CYAN,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          verticalOrigin: VerticalOrigin.BOTTOM,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        }
      });

    }, ScreenSpaceEventType.MOUSE_MOVE);

    // 우클릭 시 측정 종료: 핸들러 제거, 임시 라인 및 라벨 삭제, 최종 거리 라벨 표시
    this.measureHandler.setInputAction(() => {
      if (!this.measureHandler) return;

      this.measureHandler.destroy();
      this.measureHandler = null;

      // 임시 선, 라벨 제거
      if (this.viewer.entities.getById(`${groupId}-tempLine`)) this.viewer.entities.removeById(`${groupId}-tempLine`);
      if (this.viewer.entities.getById(`${groupId}-tempLabel`)) this.viewer.entities.removeById(`${groupId}-tempLabel`);

      // 총 거리 라벨 추가 (마지막 마커 위치 위)
      if (localPositions.length >= 2) {
        const total = this.computeTotalDistance(localPositions);
        const totalText = this.formatDistance(total);

        const last = localPositions[localPositions.length - 1];
        const labelOffset = new Cartesian2(0, -40);

        this.viewer.entities.add({
          id: `${groupId}-totalDistanceLabel`,
          position: last,
          label: {
            text: totalText,
            font: 'bold 16px sans-serif',
            fillColor: Color.WHITE,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 3,
            verticalOrigin: VerticalOrigin.BOTTOM,
            pixelOffset: labelOffset,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          }
        });
      }
    }, ScreenSpaceEventType.RIGHT_CLICK);
  }

  computeTotalDistance(points: Cartesian3[]): number {
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
      total += Cartesian3.distance(points[i], points[i + 1]);
    }
    return total;
  }

  updateDateTime() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const d = now.getDate();
    const h = now.getHours();
    const min = now.getMinutes();
    const s = now.getSeconds();

    this.currentDateTime =
      `${y}년 ${m}월 ${d}일 ${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  toDMS(degree: number): string {
    const d = Math.floor(Math.abs(degree));
    const minFloat = (Math.abs(degree) - d) * 60;
    const m = Math.floor(minFloat);
    const s = ((minFloat - m) * 60).toFixed(2);
    return `${d}° ${m}' ${s}"`;
  }

  updateScaleDisplay(): void {
    const canvas = this.viewer.scene.canvas;
    const camera = this.viewer.scene.camera;
    const scene = this.viewer.scene;

    const center = new Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2);
    const centerPosition = camera.pickEllipsoid(center, scene.globe.ellipsoid);
    if (!centerPosition) {
      this.scaleText = 'N/A';
      this.scaleBarWidth = '0px';
      return;
    }

    const right = new Cartesian2(center.x + 100, center.y);
    const rightPosition = camera.pickEllipsoid(right, scene.globe.ellipsoid);
    if (!rightPosition) {
      this.scaleText = 'N/A';
      this.scaleBarWidth = '0px';
      return;
    }

    const geodesic = new EllipsoidGeodesic();
    geodesic.setEndPoints(
      Cesium.Ellipsoid.WGS84.cartesianToCartographic(centerPosition),
      Cesium.Ellipsoid.WGS84.cartesianToCartographic(rightPosition)
    );
    const distance = geodesic.surfaceDistance;

    const { closestDistance, barWidth } = this.calculateClosestScale(distance);
    this.scaleText = this.formatDistance(closestDistance);
    this.scaleBarWidth = `${barWidth}px`;
  }

  calculateClosestScale(distance: number): { closestDistance: number; barWidth: number } {
    for (let i = 0; i < this.predefinedDistances.length; i++) {
      const scale = this.predefinedDistances[i];
      const nextScale = this.predefinedDistances[i + 1] || scale * 2;
      const ratio = distance / scale;
      const scaleWidth = this.maxScaleBarWidth / ratio;

      if (scaleWidth >= this.minScaleBarWidth && scaleWidth <= this.maxScaleBarWidth) {
        return { closestDistance: scale, barWidth: Math.round(scaleWidth) };
      } else if (scaleWidth > this.maxScaleBarWidth && distance <= nextScale) {
        return { closestDistance: nextScale, barWidth: this.minScaleBarWidth };
      }
    }
    return { closestDistance: this.predefinedDistances[0], barWidth: this.minScaleBarWidth };
  }

  formatDistance(distance: number): string {
    if (distance < 1000) {
      return `${distance}m`;
    } else {
      return `${(distance / 1000).toFixed(0)}km`;
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.scaleUpdateTimer) {
      clearTimeout(this.scaleUpdateTimer);
    }
    if (this.handler) {
      this.handler.destroy();
    }
    if (this.measureHandler) {
      this.measureHandler.destroy();
    }
    if (this.viewer) {
      this.viewer.destroy();
    }
  }

  // 면적 측정 시작
  startAreaMeasurement(): void {
    // 기존 측정 종료
    if (this.measureHandler) {
      this.measureHandler.destroy();
      this.measureHandler = null;
    }

    const groupId = `areaGroup-${this.groupIdCounter++}`;
    const localPositions: Cartesian3[] = [];

    this.measureHandler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);

    this.measureHandler.setInputAction((click: { position: Cartesian2 }) => {
      const position = this.viewer.scene.pickPosition(click.position);
      if (!position) return;

      localPositions.push(position);

      this.viewer.entities.add({
        id: `${groupId}-marker-${localPositions.length}`,
        position,
        point: {
          pixelSize: 10,
          color: Color.YELLOW,
        },
        label: {
          text: `${localPositions.length}`,
          font: "16px sans-serif",
          verticalOrigin: VerticalOrigin.BOTTOM,
          pixelOffset: new Cartesian2(0, -10),
          fillColor: Color.WHITE,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
        },
      });

      if (this.viewer.entities.getById(`${groupId}-polygon`)) {
        this.viewer.entities.removeById(`${groupId}-polygon`);
      }
      if (localPositions.length >= 3) {
        this.viewer.entities.add({
          id: `${groupId}-polygon`,
          polygon: {
            hierarchy: localPositions,
            material: Color.YELLOW.withAlpha(0.3),
            outline: true,
            outlineColor: Color.YELLOW,
          },
        });
      }
    }, ScreenSpaceEventType.LEFT_CLICK);

    this.measureHandler.setInputAction((movement: { endPosition: Cartesian2 }) => {
      if (localPositions.length < 2) return;

      const tempPosition = this.viewer.scene.pickPosition(movement.endPosition);
      if (!tempPosition) return;

      const tempHierarchy = [...localPositions, tempPosition];

      if (this.viewer.entities.getById(`${groupId}-tempPolygon`)) {
        this.viewer.entities.removeById(`${groupId}-tempPolygon`);
      }
      this.viewer.entities.add({
        id: `${groupId}-tempPolygon`,
        polygon: {
          hierarchy: tempHierarchy,
          material: Color.CYAN.withAlpha(0.2),
          outline: true,
          outlineColor: Color.CYAN,
        },
      });
    }, ScreenSpaceEventType.MOUSE_MOVE);

    this.measureHandler.setInputAction(() => {
      if (!this.measureHandler) return;

      this.measureHandler.destroy();
      this.measureHandler = null;

      if (this.viewer.entities.getById(`${groupId}-tempPolygon`)) {
        this.viewer.entities.removeById(`${groupId}-tempPolygon`);
      }

      if (localPositions.length >= 3) {
        const area = this.computePolygonArea(localPositions);
        const areaText =
          area > 1_000_000
            ? (area / 1_000_000).toFixed(2) + " km²"
            : area.toFixed(2) + " m²";

        const last = localPositions[localPositions.length - 1];
        this.viewer.entities.add({
          id: `${groupId}-areaLabel`,
          position: last,
          label: {
            text: "면적: " + areaText,
            font: "bold 16px sans-serif",
            fillColor: Color.YELLOW,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 3,
            verticalOrigin: VerticalOrigin.BOTTOM,
            pixelOffset: new Cartesian2(0, -40),
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
        });
      }
    }, ScreenSpaceEventType.RIGHT_CLICK);
  }

  computePolygonArea(positions: Cartesian3[]): number {
    const ellipsoid = Cesium.Ellipsoid.WGS84;
    const cartographic = positions.map((p) =>
      ellipsoid.cartesianToCartographic(p)
    );

    let area = 0;
    for (let i = 0; i < cartographic.length; i++) {
      const p1 = cartographic[i];
      const p2 = cartographic[(i + 1) % cartographic.length];
      area += CesiumMath.toDegrees(p2.longitude - p1.longitude) *
        (2 + Math.sin(p1.latitude) + Math.sin(p2.latitude));
    }

    area = (Math.abs(area) * Math.pow(ellipsoid.maximumRadius, 2)) / 2.0;
    return area;
  }
  isMapLocked = false;

  // 레이어 맵 고정
  toggleMapLock(): void {
    this.isMapLocked = !this.isMapLocked;
    const c = this.viewer.scene.screenSpaceCameraController;
    c.enableRotate = !this.isMapLocked;
    c.enableTranslate = !this.isMapLocked;
    c.enableZoom = !this.isMapLocked;
    c.enableTilt = !this.isMapLocked;
    c.enableLook = !this.isMapLocked;
  }

  // 클래스 멤버에 추가
  buttonStates: { [key: string]: boolean } = {
    layer: false,
    opacity: false,
    pin: false,
    distance: false,
    area: false,
    radius: false,
    cross: false,
    volume: false
  };

  // 토글 전용
  toggleButton(key: string) {
    this.buttonStates[key] = !this.buttonStates[key];
  }

  // 측정 버튼 토글 처리
  onToggleMeasurement(key: string) {
    this.buttonStates[key] = !this.buttonStates[key];

    if (this.buttonStates[key]) {
      if (key === 'distance') {
        this.startDistanceMeasurement();
      } else if (key === 'area') {
        this.startAreaMeasurement();
      }
    } else {
      // OFF: 측정 정지
      this.stopAllMeasurements();
    }
  }

  // 측정 정지
  stopAllMeasurements() {
    // 핸들러 제거
    if (this.measureHandler) {
      this.measureHandler.destroy();
      this.measureHandler = null;
    }

    const allEntities = this.viewer.entities.values.slice();
    allEntities.forEach(ent => {
      if (ent.id?.startsWith('measureGroup-')) {
        this.viewer.entities.remove(ent);
      }
    });
  }

  // 리셋 버튼
  onResetMeasurements() {
    // 측정 관련 키 false
    const measureKeys = ['distance', 'area', 'radius', 'cross', 'volume'];
    measureKeys.forEach(k => this.buttonStates[k] = false);

    this.stopAllMeasurements();
  }

  goHome() {
    // 카메라를 초기 위치로 이동
    this.viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(127.38019058822, 36.359558821549, 3000),
      duration: 2,
    });
  }

  zoomIn() {
    const camera = this.viewer.camera;

    // 현재 카메라 위치
    const carto = camera.positionCartographic;
    const currentHeight = carto.height;

    // 줌인: 높이 줄이기
    const newHeight = Math.max(currentHeight * 0.5, 100);

    // Cartesian3 변환
    const destination = Cesium.Cartesian3.fromRadians(
      carto.longitude,
      carto.latitude,
      newHeight
    );

    camera.flyTo({
      destination,
      duration: 0.5
    });
  }

  zoomOut() {
    const camera = this.viewer.camera;

    const carto = camera.positionCartographic;
    const currentHeight = carto.height;

    // 줌아웃: 높이 늘리기 (최대 5,000,000m)
    const newHeight = Math.min(currentHeight * 2, 5000000);

    const destination = Cesium.Cartesian3.fromRadians(
      carto.longitude,
      carto.latitude,
      newHeight
    );

    camera.flyTo({
      destination,
      duration: 0.5
    });
  }


}
