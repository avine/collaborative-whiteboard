import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { CwModule } from '@collaborative-whiteboard/lib';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CanvasBasicComponent } from './canvas-basic/canvas-basic.component';
import { CanvasMirrorComponent } from './canvas-mirror/canvas-mirror.component';
import { HeaderComponent } from './header/header.component';
import { HomeComponent } from './home/home.component';
import { TabsComponent } from './tabs/tabs.component';
import { TextComponent } from './text/text.component';
import { WhiteboardMirrorComponent } from './whiteboard-mirror/whiteboard-mirror.component';
import { WhiteboardComponent } from './whiteboard/whiteboard.component';

@NgModule({
  declarations: [
    AppComponent,
    CanvasBasicComponent,
    CanvasMirrorComponent,
    HeaderComponent,
    HomeComponent,
    TabsComponent,
    TextComponent,
    WhiteboardMirrorComponent,
    WhiteboardComponent,
  ],
  imports: [BrowserModule, AppRoutingModule, FormsModule, FontAwesomeModule, CwModule.forRoot()],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
