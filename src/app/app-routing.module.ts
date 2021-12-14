import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CanvasBasicComponent } from './canvas-basic/canvas-basic.component';
import { CanvasMirrorComponent } from './canvas-mirror/canvas-mirror.component';
import { HomeComponent } from './home/home.component';
import { TabsComponent } from './tabs/tabs.component';
import { TextComponent } from './text/text.component';
import { WhiteboardComponent } from './whiteboard/whiteboard.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    component: HomeComponent,
  },
  {
    path: 'canvas-basic',
    component: CanvasBasicComponent,
  },
  {
    path: 'canvas-mirror',
    component: CanvasMirrorComponent,
  },
  {
    path: 'whiteboard',
    component: WhiteboardComponent,
  },
  {
    path: 'tabs',
    component: TabsComponent,
  },
  {
    path: 'text',
    component: TextComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
