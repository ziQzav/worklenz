import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostBinding,
  Input,
  NgZone,
  OnInit,
  Renderer2
} from '@angular/core';
import {Socket} from "ngx-socket-io";
import {SocketEvents} from "@shared/socket-events";
import {IProjectTask} from "@interfaces/api-models/project-tasks-view-model";
import {WlTasksService} from "../../services/wl-tasks.service";
import {formatGanttDate} from "@shared/utils";
import {AuthService} from "@services/auth.service";

@Component({
  selector: 'worklenz-wl-start-date',
  templateUrl: './start-date.component.html',
  styleUrls: ['./start-date.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WLStartDateComponent implements OnInit {
  @Input({required: true}) task: IProjectTask | null = null;
  @HostBinding("class") cls = "flex-row task-due-date";

  constructor(
    private readonly socket: Socket,
    private readonly cdr: ChangeDetectorRef,
    private readonly ngZone: NgZone,
    private readonly service: WlTasksService,
    private readonly renderer: Renderer2,
    private readonly auth: AuthService,
  ) {
  }

  ngOnInit() {
    this.socket.on(SocketEvents.TASK_START_DATE_CHANGE.toString(), this.handleResponse);
  }

  ngOnDestroy() {
    this.socket.removeListener(SocketEvents.TASK_START_DATE_CHANGE.toString(), this.handleResponse);
  }

  private handleResponse = (response: {
    id: string;
    parent_task: string | null;
    start_date: string;
  }) => {
    if(!this.task) return;
    if (response.id === this.task.id && this.task.start_date !== response.start_date) {
      this.task.start_date = response.start_date;
      this.cdr.markForCheck();
    }
  };

  toggleHighlightCls(active: boolean, element: HTMLElement) {
    this.ngZone.runOutsideAngular(() => {
      if (active) {
        this.renderer.addClass(element, this.service.HIGHLIGHT_COL_CLS);
      } else {
        this.renderer.removeClass(element, this.service.HIGHLIGHT_COL_CLS);
      }
    });
  }

  handleStartDateChange(date: string, task: IProjectTask) {
    this.socket.emit(
      SocketEvents.TASK_START_DATE_CHANGE.toString(), JSON.stringify({
        task_id: task.id,
        start_date: formatGanttDate(date) || null,
        parent_task: task.parent_task_id,
        time_zone: this.auth.getCurrentSession()?.timezone_name ? this.auth.getCurrentSession()?.timezone_name : Intl.DateTimeFormat().resolvedOptions().timeZone
      }));
  }

}
