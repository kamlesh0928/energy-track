import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  TrendingUp, 
  Zap, 
  AlertTriangle, 
  Activity, 
  Database, 
  Brain, 
  Wrench, 
  Power,
  ThermometerSun,
  Settings,
  CheckCircle,
  Clock,
  BarChart3,
  DollarSign
} from 'lucide-react';
import { Device, DeviceStatus } from '@/types/factory';

// Mock data for devices (using same devices as factory)
const mockDevices: Device[] = [
  {
    id: 'M001',
    type: 'CNC_Mill',
    status: 'NORMAL',
    anomaly_count: 0,
    sensors: { temperature: 65, vibration: 2.1, power: 415 },
    location: { x: 20, y: 30 },
    isOnline: true,
    energyConsumption: 85,
    efficiency: 94.2,
    process: 'Motor Unit A1 • Motor'
  },
  {
    id: 'P002',
    type: 'Hydraulic_Press',
    status: 'WARNING',
    anomaly_count: 1,
    sensors: { temperature: 78, pressure: 410, power: 410 },
    location: { x: 60, y: 50 },
    isOnline: true,
    energyConsumption: 92,
    efficiency: 87.5,
    process: 'Pump System B2 • Pump'
  },
  {
    id: 'C003',
    type: 'Conveyor',
    status: 'NORMAL',
    anomaly_count: 0,
    sensors: { temperature: 58, speed: 420, power: 420 },
    location: { x: 80, y: 70 },
    isOnline: true,
    energyConsumption: 76,
    efficiency: 91.8,
    process: 'Compressor C1 • Compressor'
  },
  {
    id: 'G004',
    type: 'Surface_Grinder',
    status: 'CRITICAL',
    anomaly_count: 3,
    sensors: { temperature: 25, power: 0 },
    location: { x: 40, y: 80 },
    isOnline: false,
    energyConsumption: 0,
    efficiency: 85.4,
    process: 'Generator D1 • Generator'
  },
  {
    id: 'H005',
    type: 'Robot_Arm',
    status: 'NORMAL',
    anomaly_count: 0,
    sensors: { temperature: 22, power: 380, efficiency: 45 },
    location: { x: 70, y: 20 },
    isOnline: true,
    energyConsumption: 45,
    efficiency: 89.3,
    process: 'HVAC System E1 • HVAC'
  },
  {
    id: 'L006',
    type: 'Lathe',
    status: 'NORMAL',
    anomaly_count: 0,
    sensors: { temperature: 35, power: 230, brightness: 25 },
    location: { x: 30, y: 60 },
    isOnline: true,
    energyConsumption: 25,
    efficiency: 96.7,
    process: 'Lighting Zone F1 • Lighting'
  }
];

const Dashboard = () => {
  const [devices, setDevices] = useState<Device[]>(mockDevices);
  const [liveData, setLiveData] = useState([
    { type: 'power', value: '19.2A', unit: 'A', status: 'normal' },
    { type: 'temperature', value: '88.9°C', unit: '°C', status: 'normal' },
    { type: 'pressure', value: '127.4 PSI', unit: 'PSI', status: 'normal' }
  ]);

  // Simulate live data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveData(prev => prev.map(item => ({
        ...item,
        value: item.type === 'power' 
          ? `${(Math.random() * 5 + 17).toFixed(1)}A`
          : item.type === 'temperature'
          ? `${(Math.random() * 10 + 85).toFixed(1)}°C`
          : `${(Math.random() * 20 + 120).toFixed(1)} PSI`
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const totalDevices = devices.length;
  const onlineDevices = devices.filter(d => d.isOnline).length;
  const warningDevices = devices.filter(d => d.status === 'WARNING').length;
  const offlineDevices = devices.filter(d => !d.isOnline).length;
  const criticalAlerts = devices.filter(d => d.status === 'CRITICAL').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-navbar text-white industrial-shadow sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4" style={{ backgroundColor: 'hsl(210 100% 20%)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
              <p className="text-white/90">Industrial Monitoring & Prediction Platform</p>
            </div>
            <div className="flex items-center gap-4">
              <a 
                href="/" 
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                <div className="text-lg font-semibold">Back to Main</div>
              </a>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm text-white/90">System Online</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6 space-y-6">
        {/* Enhanced KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-primary/20 shadow-navy hover:shadow-navy-glow transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Devices</CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{totalDevices}</div>
              <p className="text-xs text-primary font-medium">+12 from last month</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 shadow-navy hover:shadow-navy-glow transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Energy Saved</CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Zap className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">₹2.4L</div>
              <p className="text-xs text-primary font-medium">+18% from last month</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 shadow-navy hover:shadow-navy-glow transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Alerts</CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{criticalAlerts + warningDevices}</div>
              <p className="text-xs text-red-600 font-medium">-2 from last month</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 shadow-navy hover:shadow-navy-glow transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Efficiency</CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">94.2%</div>
              <p className="text-xs text-primary font-medium">+5.1% from last month</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-primary/5 border border-primary/20">
            <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-navy">IoT Analytics</TabsTrigger>
            <TabsTrigger value="devices" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-navy">Device Control</TabsTrigger>
            <TabsTrigger value="maintenance" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-navy">Maintenance</TabsTrigger>
            <TabsTrigger value="alerts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-navy">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            {/* IoT Analytics & AI Insights */}
            <Card className="border-primary/30 shadow-navy">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Database className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-primary">IoT Analytics & AI Insights</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">Real-time data streaming, ML-based optimization, and predictive analytics</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <Card className="p-4 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 shadow-navy">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-primary">Overall Efficiency</span>
                    </div>
                    <div className="text-2xl font-bold text-primary">85.4%</div>
                  </Card>
                  
                  <Card className="p-4 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 shadow-navy">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-primary">Energy Usage</span>
                    </div>
                    <div className="text-2xl font-bold text-primary">0.7 kWh</div>
                  </Card>
                  
                  <Card className="p-4 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 shadow-navy">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-primary">Predicted Failures</span>
                    </div>
                    <div className="text-2xl font-bold text-amber-600">2</div>
                  </Card>
                  
                  <Card className="p-4 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 shadow-navy">
                    <div className="flex items-center gap-2 mb-2">
                      <Settings className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-primary">Optimization Ops</span>
                    </div>
                    <div className="text-2xl font-bold text-primary">5</div>
                  </Card>
                </div>

                {/* Live IoT Data Stream */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Live IoT Data Stream</h3>
                  </div>
                  <div className="grid gap-3">
                    {liveData.map((data, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {data.type === 'power' && <Zap className="h-4 w-4 text-blue-500" />}
                          {data.type === 'temperature' && <ThermometerSun className="h-4 w-4 text-orange-500" />}
                          {data.type === 'pressure' && <Activity className="h-4 w-4 text-green-500" />}
                          <span className="font-mono text-lg">{data.value}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">11:09:42</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Optimization Suggestions */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  <CardTitle>AI Optimization Suggestions</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">MEDIUM</Badge>
                        <span className="font-medium">ENERGY OPTIMIZATION</span>
                      </div>
                      <p className="text-sm">Reduce CNC-2 operating hours by 15% during off-peak to save energy</p>
                      <p className="text-xs text-muted-foreground">Potential Impact: 12% energy reduction</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Apply
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">HIGH</Badge>
                        <span className="font-medium">MAINTENANCE</span>
                      </div>
                      <p className="text-sm">LATHE-1 showing temperature anomaly - schedule maintenance</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Apply
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">HIGH</Badge>
                        <span className="font-medium">SAFETY</span>
                      </div>
                      <p className="text-sm">ARM-1 pressure levels approaching critical threshold</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Apply
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Energy Monitoring */}
            <Card>
              <CardHeader>
                <CardTitle>Energy Monitoring</CardTitle>
                <p className="text-sm text-muted-foreground">Current consumption and savings overview</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Current Load</span>
                        <span className="font-bold">847 kW</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Efficiency</span>
                        <span className="font-bold">94.2%</span>
                      </div>
                      <Progress value={94} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Cost Savings</span>
                        <span className="font-bold text-green-600">₹2.4L</span>
                      </div>
                      <Progress value={60} className="h-2" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">15.2%</div>
                      <p className="text-sm text-muted-foreground">Energy Saved</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">₹48.7K</div>
                      <p className="text-sm text-muted-foreground">Monthly Savings</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="devices" className="space-y-6">
            {/* Device Control Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Power className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Devices</p>
                      <p className="text-2xl font-bold">{totalDevices}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Online</p>
                      <p className="text-2xl font-bold text-green-600">{onlineDevices}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Warnings</p>
                      <p className="text-2xl font-bold text-yellow-600">{warningDevices}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Power className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Offline</p>
                      <p className="text-2xl font-bold text-red-600">{offlineDevices}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Device Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {devices.map((device) => (
                <Card key={device.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${
                          device.status === 'NORMAL' ? 'bg-green-500' :
                          device.status === 'WARNING' ? 'bg-yellow-500' :
                          device.status === 'CRITICAL' ? 'bg-red-500' : 'bg-gray-500'
                        }`}></div>
                        <CardTitle className="text-lg">{device.id}</CardTitle>
                      </div>
                      <Badge variant={device.isOnline ? 'default' : 'secondary'}>
                        {device.isOnline ? 'online' : 'offline'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{device.process}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Power Control</span>
                        <Switch checked={device.isOnline} />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Load</span>
                          <span className="text-sm font-medium">{device.energyConsumption}%</span>
                        </div>
                        <Progress value={device.energyConsumption} className="h-2" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <ThermometerSun className="h-4 w-4 text-orange-500" />
                          <span>{device.sensors.temperature}°C</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-blue-500" />
                          <span>{device.sensors.power || 0}V</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        Last maintenance: {Math.floor(Math.random() * 30) + 1} days ago
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Bulk Operations */}
            <Card>
              <CardHeader>
                <CardTitle>Bulk Operations</CardTitle>
                <p className="text-sm text-muted-foreground">Control multiple devices simultaneously</p>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button variant="default">Turn On All Devices</Button>
                  <Button variant="outline">Emergency Shutdown</Button>
                  <Button variant="outline">Schedule Maintenance</Button>
                  <Button variant="outline">Export Device Status</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-6">
            {/* Upcoming Maintenance */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  <CardTitle>Upcoming Maintenance</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {devices.filter(d => d.status !== 'NORMAL' || Math.random() > 0.5).slice(0, 4).map((device, index) => (
                    <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`h-3 w-3 rounded-full ${
                          index === 0 ? 'bg-red-500' : index === 1 ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}></div>
                        <div>
                          <p className="font-medium">{device.id}</p>
                          <p className="text-sm text-muted-foreground">{device.process}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-muted-foreground">
                              Health Score: {device.efficiency}%
                            </span>
                            <span className="text-sm text-muted-foreground">
                              Confidence: {90 + Math.floor(Math.random() * 10)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <Badge variant={index === 0 ? 'destructive' : index === 1 ? 'default' : 'secondary'}>
                            {index === 0 ? 'Critical - Immediate Action' : index === 1 ? 'Monitor Closely' : 'Excellent Condition'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Time to Failure: {index === 0 ? '3 days' : index === 1 ? '45 days' : '180+ days'}
                        </p>
                        <div className="flex gap-2 mt-2">
                          {index === 0 && (
                            <Button size="sm" variant="destructive">
                              <Wrench className="h-4 w-4 mr-2" />
                              Emergency Repair
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Clock className="h-4 w-4 mr-2" />
                            Schedule Maintenance
                          </Button>
                        </div>
                        {index === 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground">Identified Risks:</p>
                            <div className="flex gap-1 mt-1">
                              <Badge variant="outline" className="text-xs">Impeller damage</Badge>
                              <Badge variant="outline" className="text-xs">Seal leakage</Badge>
                              <Badge variant="outline" className="text-xs">Vibration anomaly</Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            {/* Alert Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-red-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Critical Alerts</p>
                      <p className="text-2xl font-bold text-red-600">1</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-yellow-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-8 w-8 text-yellow-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Warnings</p>
                      <p className="text-2xl font-bold text-yellow-600">1</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Info Alerts</p>
                      <p className="text-2xl font-bold text-blue-600">0</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Resolved Today</p>
                      <p className="text-2xl font-bold text-green-600">12</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts & Notifications</CardTitle>
                <p className="text-sm text-muted-foreground">Latest system alerts and maintenance notifications</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="font-medium">High Temperature Alert</p>
                        <p className="text-sm text-muted-foreground">Motor Unit A1 temperature has exceeded 75°C threshold</p>
                        <p className="text-xs text-muted-foreground">Device: M001 - Motor Unit A1 • 2024-01-15 14:32:15</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">critical</Badge>
                      <Badge variant="secondary">active</Badge>
                      <Badge variant="outline">New</Badge>
                      <span className="text-sm text-muted-foreground">2 mins ago</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="font-medium">Efficiency Drop Warning</p>
                        <p className="text-sm text-muted-foreground">Pump System B2 efficiency dropped below 80% operational threshold</p>
                        <p className="text-xs text-muted-foreground">Device: P002 - Pump System B2 • 2024-01-15 14:28:42</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">warning</Badge>
                      <Badge variant="secondary">active</Badge>
                      <span className="text-sm text-muted-foreground">5 mins ago</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">Scheduled Maintenance Due</p>
                        <p className="text-sm text-muted-foreground">Compressor C1 is due for scheduled maintenance according to the maintenance calendar</p>
                        <p className="text-xs text-muted-foreground">Device: C003 - Compressor C1 • 2024-01-15 13:15:22</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">info</Badge>
                      <Badge variant="outline">pending</Badge>
                      <Badge variant="outline">New</Badge>
                      <span className="text-sm text-muted-foreground">1 hour ago</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Optimal Performance Achieved</p>
                        <p className="text-sm text-muted-foreground">Lighting Zone F1 has achieved optimal energy efficiency for 24 hours</p>
                        <p className="text-xs text-muted-foreground">Device: L006 - Lighting Zone F1 • 2024-01-15 10:00:00</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-green-600 border-green-600">success</Badge>
                      <Badge variant="outline">resolved</Badge>
                      <span className="text-sm text-muted-foreground">4 hours ago</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <Button variant="outline">Load More Alerts</Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button variant="default">Create Alert Rule</Button>
                  <Button variant="outline">Export Alert History</Button>
                  <Button variant="outline">Configure Notifications</Button>
                  <Button variant="outline">Alert Dashboard</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;