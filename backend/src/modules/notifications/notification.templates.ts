interface TaskEmailData {
  recipientName: string;

  taskTitle: string;

  projectName: string;

  priority: string;

  status: string;

  dueDate?: Date | null;

  taskUrl: string;

  reporterName?: string;

  assigneeName?: string;
}


/**
 * Escape values before inserting them into HTML.
 */
const escapeHtml = (value: unknown) => {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};


/**
 * Format date similar to Jira.
 */
const formatDate = (
  date?: Date | null
) => {

  if (!date) {
    return "No due date";
  }

  return new Intl.DateTimeFormat(
    "en-LK",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
};


const formatValue = (
  value?: string | null
) => {

  if (!value) {
    return "-";
  }

  return value
    .toLowerCase()
    .split("_")
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
};


/**
 * Jira-style email wrapper.
 */
const jiraTemplate = (
  heading: string,
  content: string
) => `
<!DOCTYPE html>

<html>

<head>

  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>${escapeHtml(heading)}</title>

</head>


<body
  style="
    margin:0;
    padding:0;
    background:#ffffff;
    font-family:Arial, Helvetica, sans-serif;
    color:#172B4D;
  "
>

  <div
    style="
      max-width:900px;
      margin:0 auto;
      padding:40px 32px;
    "
  >

    ${content}


    <!-- Footer -->

    <div
      style="
        margin-top:45px;
        padding-top:25px;
        border-top:1px solid #DFE1E6;
        font-size:12px;
        color:#6B778C;
      "
    >

      <p style="margin:0 0 8px 0;">
        This email was sent by the Task Management System.
      </p>

      <p style="margin:0;">
        Please do not reply to this automated email.
      </p>

    </div>

  </div>

</body>

</html>
`;


/**
 * Common task information block.
 */
const taskInformation = (
  data: TaskEmailData
) => `
<div
  style="
    margin-top:24px;
    margin-bottom:30px;
  "
>

  <table
    cellpadding="0"
    cellspacing="0"
    width="100%"
    style="
      border-collapse:collapse;
      font-size:15px;
    "
  >

    <tr>

      <td
        style="
          padding:9px 0;
          width:150px;
          color:#172B4D;
          font-weight:bold;
        "
      >
        Status:
      </td>

      <td
        style="
          padding:9px 0;
          color:#172B4D;
        "
      >
        <span
          style="
            display:inline-block;
            padding:5px 10px;
            background:#DFE1E6;
            border-radius:4px;
            font-size:12px;
            font-weight:bold;
            text-transform:uppercase;
          "
        >
          ${escapeHtml(formatValue(data.status))}
        </span>
      </td>

    </tr>


    <tr>

      <td
        style="
          padding:9px 0;
          font-weight:bold;
        "
      >
        Priority:
      </td>

      <td
        style="
          padding:9px 0;
        "
      >
        ${escapeHtml(formatValue(data.priority))}
      </td>

    </tr>


    <tr>

      <td
        style="
          padding:9px 0;
          font-weight:bold;
        "
      >
        Assignee:
      </td>

      <td
        style="
          padding:9px 0;
        "
      >
        ${escapeHtml(data.assigneeName || "-")}
      </td>

    </tr>


    <tr>

      <td
        style="
          padding:9px 0;
          font-weight:bold;
        "
      >
        Reporter:
      </td>

      <td
        style="
          padding:9px 0;
        "
      >
        ${escapeHtml(data.reporterName || "-")}
      </td>

    </tr>


    <tr>

      <td
        style="
          padding:9px 0;
          font-weight:bold;
        "
      >
        Due date:
      </td>

      <td
        style="
          padding:9px 0;
        "
      >
        ${escapeHtml(formatDate(data.dueDate))}
      </td>

    </tr>

  </table>

</div>
`;


/**
 * ------------------------------------------------------------
 * TASK ASSIGNED
 * ------------------------------------------------------------
 */
export const assignmentEmail = (
  data: TaskEmailData
) => {
  const recipientName =
    escapeHtml(data.recipientName);

  const taskTitle =
    escapeHtml(data.taskTitle);

  const projectName =
    escapeHtml(data.projectName);

  const priority =
    escapeHtml(data.priority);

  const status =
    escapeHtml(data.status);

  const taskUrl =
    escapeHtml(data.taskUrl);

  const dueDate =
    escapeHtml(
      formatDate(data.dueDate)
    );

  return `
<!DOCTYPE html>

<html>

<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>Task Assigned</title>
</head>

<body
  style="
    margin:0;
    padding:20px;
    background:#f5f7fb;
    font-family:Arial,Helvetica,sans-serif;
    color:#172B4D;
  "
>

  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
  >

    <tr>

      <td align="center">

        <table
          width="600"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            width:100%;
            max-width:600px;
            background:#ffffff;
            border:1px solid #dfe1e6;
          "
        >

          <!-- Header -->

          <tr>

            <td
              style="
                padding:24px;
                background:#0052CC;
                color:#ffffff;
              "
            >

              <h1
                style="
                  margin:0;
                  font-size:24px;
                "
              >
                Task Management System
              </h1>

            </td>

          </tr>


          <!-- Content -->

          <tr>

            <td
              style="
                padding:30px;
              "
            >

              <h2
                style="
                  margin:0 0 20px 0;
                  font-size:24px;
                  color:#172B4D;
                "
              >
                ${recipientName} has been assigned a task
              </h2>


              <p
                style="
                  font-size:16px;
                  line-height:1.6;
                "
              >
                Hi ${recipientName},
              </p>


              <p
                style="
                  font-size:16px;
                  line-height:1.6;
                "
              >
                You have been assigned to the following task.
              </p>


              <!-- Task title -->

              <div
                style="
                  margin-top:25px;
                  padding-bottom:15px;
                  border-bottom:2px solid #172B4D;
                "
              >

                <p
                  style="
                    margin:0 0 8px 0;
                    color:#6B778C;
                    font-size:14px;
                  "
                >
                  ${projectName}
                </p>

                <a
                  href="${taskUrl}"
                  style="
                    color:#0052CC;
                    font-size:24px;
                    text-decoration:none;
                  "
                >
                  ${taskTitle}
                </a>

              </div>


              <!-- Task details -->

              <table
                width="100%"
                cellpadding="8"
                cellspacing="0"
                border="0"
                style="
                  margin-top:25px;
                  font-size:15px;
                "
              >

                <tr>

                  <td
                    width="140"
                    style="
                      font-weight:bold;
                    "
                  >
                    Status:
                  </td>

                  <td>
                    ${status}
                  </td>

                </tr>


                <tr>

                  <td
                    style="
                      font-weight:bold;
                    "
                  >
                    Priority:
                  </td>

                  <td>
                    ${priority}
                  </td>

                </tr>


                <tr>

                  <td
                    style="
                      font-weight:bold;
                    "
                  >
                    Assignee:
                  </td>

                  <td>
                    ${escapeHtml(
                      data.assigneeName || "-"
                    )}
                  </td>

                </tr>


                <tr>

                  <td
                    style="
                      font-weight:bold;
                    "
                  >
                    Reporter:
                  </td>

                  <td>
                    ${escapeHtml(
                      data.reporterName || "-"
                    )}
                  </td>

                </tr>


                <tr>

                  <td
                    style="
                      font-weight:bold;
                    "
                  >
                    Due date:
                  </td>

                  <td>
                    ${dueDate}
                  </td>

                </tr>

              </table>


              <!-- Button -->

              <div
                style="
                  margin-top:30px;
                "
              >

                <a
                  href="${taskUrl}"
                  style="
                    display:inline-block;
                    padding:13px 22px;
                    background:#0052CC;
                    color:#ffffff;
                    text-decoration:none;
                    font-weight:bold;
                    border-radius:3px;
                  "
                >
                  View task
                </a>

              </div>

            </td>

          </tr>


          <!-- Footer -->

          <tr>

            <td
              style="
                padding:20px 30px;
                border-top:1px solid #dfe1e6;
                color:#6B778C;
                font-size:12px;
              "
            >

              <p
                style="
                  margin:0 0 8px 0;
                "
              >
                This email was sent by the
                Task Management System.
              </p>

              <p
                style="
                  margin:0;
                "
              >
                Please do not reply to this automated email.
              </p>

            </td>

          </tr>

        </table>

      </td>

    </tr>

  </table>

</body>

</html>
`;
};

/**
 * ------------------------------------------------------------
 * STATUS UPDATED
 * ------------------------------------------------------------
 */
export const statusUpdateEmail = (
  data: TaskEmailData,
  oldStatus: string,
  newStatus: string
) => {

  return jiraTemplate(
    "Task status updated",
    `

      <p
        style="
          margin:0 0 18px 0;
          font-size:22px;
          font-weight:bold;
          color:#172B4D;
        "
      >
        Task status was updated
      </p>


      <div
        style="
          border-bottom:2px solid #172B4D;
          padding-bottom:10px;
          margin-bottom:25px;
        "
      >

        <div
          style="
            font-size:15px;
            color:#6B778C;
            margin-bottom:8px;
          "
        >
          ${escapeHtml(data.projectName)}
        </div>


        <a
          href="${data.taskUrl}"
          style="
            font-size:28px;
            line-height:1.3;
            color:#0052CC;
            text-decoration:none;
            font-weight:500;
          "
        >
          ${escapeHtml(data.taskTitle)}
        </a>

      </div>


      <p
        style="
          font-size:16px;
          line-height:1.6;
          color:#172B4D;
        "
      >
        Hi ${escapeHtml(data.recipientName)},
      </p>


      <p
        style="
          font-size:16px;
          line-height:1.6;
          color:#172B4D;
        "
      >
        The status of this task has been updated.
      </p>


      <div
        style="
          margin:25px 0;
          padding:18px;
          background:#F4F5F7;
          border-radius:4px;
        "
      >

        <strong>
          Status:
        </strong>

        <span
          style="
            text-decoration:line-through;
            margin-left:8px;
            color:#6B778C;
          "
        >
          ${escapeHtml(formatValue(oldStatus))}
        </span>

        <span
          style="
            margin:0 8px;
            color:#6B778C;
          "
        >
          →
        </span>

        <span
          style="
            background:#E3FCEF;
            color:#006644;
            padding:5px 10px;
            border-radius:4px;
            font-weight:bold;
          "
        >
          ${escapeHtml(formatValue(newStatus))}
        </span>

      </div>


      ${taskInformation({
        ...data,
        status: newStatus,
      })}


      <a
        href="${data.taskUrl}"
        style="
          display:inline-block;
          background:#0052CC;
          color:#ffffff;
          text-decoration:none;
          padding:13px 22px;
          border-radius:3px;
          font-size:15px;
          font-weight:bold;
        "
      >
        View task
      </a>

    `
  );
};


/**
 * ------------------------------------------------------------
 * ASSIGNEE CHANGED
 * ------------------------------------------------------------
 */
export const assigneeChangedEmail = (
  data: TaskEmailData
) => {

  return jiraTemplate(
    "Task assignment updated",
    `

      <p
        style="
          font-size:22px;
          font-weight:bold;
          margin:0 0 18px 0;
        "
      >
        You have been assigned a task
      </p>


      <div
        style="
          border-bottom:2px solid #172B4D;
          padding-bottom:10px;
          margin-bottom:25px;
        "
      >

        <div
          style="
            font-size:15px;
            color:#6B778C;
            margin-bottom:8px;
          "
        >
          ${escapeHtml(data.projectName)}
        </div>


        <a
          href="${data.taskUrl}"
          style="
            font-size:28px;
            color:#0052CC;
            text-decoration:none;
          "
        >
          ${escapeHtml(data.taskTitle)}
        </a>

      </div>


      <p
        style="
          font-size:16px;
          line-height:1.6;
        "
      >
        Hi ${escapeHtml(data.recipientName)},
      </p>


      <p
        style="
          font-size:16px;
          line-height:1.6;
        "
      >
        You have been assigned to this task.
      </p>


      ${taskInformation(data)}


      <a
        href="${data.taskUrl}"
        style="
          display:inline-block;
          background:#0052CC;
          color:white;
          text-decoration:none;
          padding:13px 22px;
          border-radius:3px;
          font-weight:bold;
        "
      >
        View task
      </a>

    `
  );
  
};
/**
 * ------------------------------------------------------------
 * DUE DATE APPROACHING
 * ------------------------------------------------------------
 */

export const dueDateApproachingEmail = (
  data: TaskEmailData
) => {

  return jiraTemplate(
    "Task due soon",
    `
      <p
        style="
          margin:0 0 18px 0;
          font-size:22px;
          font-weight:bold;
          color:#172B4D;
        "
      >
        Task is due soon
      </p>

      <div
        style="
          border-bottom:2px solid #172B4D;
          padding-bottom:10px;
          margin-bottom:25px;
        "
      >

        <div
          style="
            font-size:15px;
            color:#6B778C;
            margin-bottom:8px;
          "
        >
          ${escapeHtml(data.projectName)}
        </div>

        <a
          href="${escapeHtml(data.taskUrl)}"
          style="
            font-size:28px;
            line-height:1.3;
            color:#0052CC;
            text-decoration:none;
            font-weight:500;
          "
        >
          ${escapeHtml(data.taskTitle)}
        </a>

      </div>

      <p
        style="
          font-size:16px;
          line-height:1.6;
          color:#172B4D;
        "
      >
        Hi ${escapeHtml(data.recipientName)},
      </p>

      <p
        style="
          font-size:16px;
          line-height:1.6;
          color:#172B4D;
        "
      >
        This is a reminder that the following task is
        <strong>due within the next 24 hours</strong>.
      </p>

      ${taskInformation(data)}

      <a
        href="${escapeHtml(data.taskUrl)}"
        style="
          display:inline-block;
          background:#0052CC;
          color:#ffffff;
          text-decoration:none;
          padding:13px 22px;
          border-radius:3px;
          font-size:15px;
          font-weight:bold;
        "
      >
        View task
      </a>
    `
  );
};


/**
 * ------------------------------------------------------------
 * DUE TODAY
 * ------------------------------------------------------------
 */

export const dueTodayEmail = (
  data: TaskEmailData
) => {

  return jiraTemplate(
    "Task due today",
    `
      <p
        style="
          margin:0 0 18px 0;
          font-size:22px;
          font-weight:bold;
          color:#172B4D;
        "
      >
        Task is due today
      </p>

      <div
        style="
          border-bottom:2px solid #172B4D;
          padding-bottom:10px;
          margin-bottom:25px;
        "
      >

        <div
          style="
            font-size:15px;
            color:#6B778C;
            margin-bottom:8px;
          "
        >
          ${escapeHtml(data.projectName)}
        </div>

        <a
          href="${escapeHtml(data.taskUrl)}"
          style="
            font-size:28px;
            line-height:1.3;
            color:#0052CC;
            text-decoration:none;
            font-weight:500;
          "
        >
          ${escapeHtml(data.taskTitle)}
        </a>

      </div>

      <p
        style="
          font-size:16px;
          line-height:1.6;
          color:#172B4D;
        "
      >
        Hi ${escapeHtml(data.recipientName)},
      </p>

      <p
        style="
          font-size:16px;
          line-height:1.6;
          color:#172B4D;
        "
      >
        This is a reminder that this task is
        <strong>due today</strong>.
      </p>

      ${taskInformation(data)}

      <a
        href="${escapeHtml(data.taskUrl)}"
        style="
          display:inline-block;
          background:#0052CC;
          color:#ffffff;
          text-decoration:none;
          padding:13px 22px;
          border-radius:3px;
          font-size:15px;
          font-weight:bold;
        "
      >
        View task
      </a>
    `
  );
};


/**
 * ------------------------------------------------------------
 * OVERDUE
 * ------------------------------------------------------------
 */

export const overdueTaskEmail = (
  data: TaskEmailData
) => {

  return jiraTemplate(
    "Task overdue",
    `
      <p
        style="
          margin:0 0 18px 0;
          font-size:22px;
          font-weight:bold;
          color:#172B4D;
        "
      >
        Task is overdue
      </p>

      <div
        style="
          border-bottom:2px solid #172B4D;
          padding-bottom:10px;
          margin-bottom:25px;
        "
      >

        <div
          style="
            font-size:15px;
            color:#6B778C;
            margin-bottom:8px;
          "
        >
          ${escapeHtml(data.projectName)}
        </div>

        <a
          href="${escapeHtml(data.taskUrl)}"
          style="
            font-size:28px;
            line-height:1.3;
            color:#DE350B;
            text-decoration:none;
            font-weight:500;
          "
        >
          ${escapeHtml(data.taskTitle)}
        </a>

      </div>

      <p
        style="
          font-size:16px;
          line-height:1.6;
          color:#172B4D;
        "
      >
        Hi ${escapeHtml(data.recipientName)},
      </p>

      <p
        style="
          font-size:16px;
          line-height:1.6;
          color:#172B4D;
        "
      >
        The following task is now
        <strong style="color:#DE350B;">
          overdue
        </strong>.
      </p>

      ${taskInformation(data)}

      <p
        style="
          font-size:15px;
          color:#6B778C;
          line-height:1.6;
        "
      >
        Please review the task and take the necessary action.
      </p>

      <a
        href="${escapeHtml(data.taskUrl)}"
        style="
          display:inline-block;
          background:#0052CC;
          color:#ffffff;
          text-decoration:none;
          padding:13px 22px;
          border-radius:3px;
          font-size:15px;
          font-weight:bold;
        "
      >
        View task
      </a>
    `
  );
};